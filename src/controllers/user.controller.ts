import { google } from "googleapis";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../db/connect.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Request, Response } from "express";
import PdfParse from "pdf-parse";
import { z } from "zod";
import { extractSubscriptionDetails } from "../services/ai.service.js";

const uuidSchema = z.object({
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional()
})

// generated a endpoint for the google oauth2 and redirect user to it for authentication
const googleAuth = asyncHandler (async (req:Request , res:Response)=>{
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  const scopes = [' https://www.googleapis.com/auth/gmail.readonly']
  const url = oauth2Client.generateAuthUrl({
    access_type:"offline",
    scope:scopes
  })

  res.redirect(url)

})

const googleLogin = asyncHandler(async (req:Request , res:Response)=>{
  const code = req.query.code as string
  const {userId} = uuidSchema.parse({userId:req.body.userId})

  const oauth2Client = new google.auth.OAuth2(
   process.env.CLIENT_ID,
   process.env.CLIENT_SECRET,
   process.env.REDIRECT_URL
  )

  try {
   const { tokens } = await oauth2Client.getToken(code); 
   oauth2Client.setCredentials(tokens);

   const user = await prisma.user.update({
    where:{
      id:userId
    },
    data:{
      tokens:JSON.stringify(tokens)
    }
   })
   return res.status(200)
   .json(new ApiResponse (200 , 'Login successfull!!'))
  } catch (error:any) {
    console.error(error)
   throw new ApiError(500 , "Something went wrong. Try login again" , error)
   
  }
})

const getSubscriptions = asyncHandler (async (req:Request , res:Response)=>{
  const {userId} = uuidSchema.parse({userId:req.query.userId})

  const user = await prisma.user.findFirst({
    where:{
      id:userId
    }
  })

  if (!user || !user.tokens) {
    return res.status(400).json({ error: "User not found or tokens are missing." });
  }

  const tokens = JSON.parse(user.tokens)

  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  oauth2Client.setCredentials(tokens)

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Format the date in YYYY/MM/DD
    const formattedDate = `${oneYearAgo.getFullYear()}/${(oneYearAgo.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${oneYearAgo.getDate().toString().padStart(2, "0")}`;
    
    // we are fetching last one year emails
    const searchQuery = `subject:receipt OR subject:invoice after:${formattedDate}`;
    const listResponse = await gmail.users.messages.list({
      userId: "me",   // the authorized user
      q: searchQuery,
    });

    const emails = listResponse.data.messages;

    if (!emails || emails.length === 0) {
      return res.status(200).json({ message: "No emails found" });
    }
    console.log("EMAIL" , emails)

    /*
    The above "emails" is an array of email ids which has invoice or receipt in there subject.
    we want to extract text of each email's attachment.
    
    So , the steps we do are :-

    1. We will map the emails array and for each email , we will then request the gmail api with the emailId and get its whole body.
      the body is divided into parts , like header , html , main body , subject , attachment
      Here we will get the attachment id of that email

    2. Now we have attachmentId of email , we will then again request the gmail api with attachmentId 
       and the email id of the attachment. we will fetch the attachment text.
       This text is in base64 format , we will convert this into binary using nodejs buffer function.
       then we will convert this binary data into text using pdf-parse library.

    3. After this we will have a nested array of objects with attachment text of different emails.
       we will convert this into a single array.
    
    4. Now we will pass this whole text to mistralai/Mixtral-8x7B-Instruct-v0.1 using hugging face inference api.
       I have given such system prompt to this ai model , that it will return me service name , renewal date , amount , frequency of each subscription data 
       and then return the data in a specific format.
    */

    
    const emailAttachments = await Promise.all(
      // fetch each email body
      emails.map(async (email:any) => {
        const messageDetails = await gmail.users.messages.get({
          userId: "me",
          id: email.id,
        });

        const parts = messageDetails.data.payload?.parts || [];

        // Extract attachments text
        const attachments = await Promise.all(
          // fetch attachment text for each attachmentId
          parts
            .filter((part) => part.body?.attachmentId)
            .map(async (attachment:any) => {
              const attachmentId = attachment.body.attachmentId;

              // Fetch the attachment content
              const attachmentResponse = await gmail.users.messages.attachments.get({
                userId: "me",
                messageId: email.id,
                id: attachmentId,
              });

              const attachmentData:any = attachmentResponse.data.data;
              
              // converting base64 data into binary 
              const pdfBuffer = Buffer.from(attachmentData , "base64")

              // now binary data into text
              const pdfText = await PdfParse(pdfBuffer)            
              return {
                pdfText:pdfText
              }
            })
        )
        return {
          attachments: attachments.filter(Boolean), // Only include non-null attachments
        } 
      })
    )
    
    // converting nested array pdf text into plain array to pass to ai model
    const allTexts = emailAttachments.flatMap((email) => email.attachments).map((attachment) => attachment.pdfText.text);
    const combinedText = allTexts.join("\n\n"); // Combine all extracted text with a separator

    console.log("combined text" , combinedText)

    // passing the extracted subscription data to ai model , to get desired output
    const subscriptions = await extractSubscriptionDetails(combinedText)

    console.log("subscriptions" , subscriptions)

    // delete previous subscriptions
    await prisma.subscription.deleteMany({
      where:{
        authorId: userId
      }
    })
    console.log("deleted in db")

    // saving in db
    await Promise.all(
      subscriptions!.map(async (subscription:any)=> await prisma.subscription.create({
        data:{
          service:subscription.service,
          amount: subscription.amount,
          frequency:subscription.frequency,
          lastRenewalDate:subscription.lastRenewalDate,
          authorId:userId
        }
      }))
    )

    console.log("saved in db")

    return res.status(200).json(
      new ApiResponse(200 , subscriptions , "Subscriptions Data fetched successfully")
    )
  } catch (error:any){
    throw new ApiError(500 , "Something went wrong while fetching subscriptions " , error)
  }
})

const getUserDetails = asyncHandler (async (req:Request , res:Response)=>{
  const {userId} = uuidSchema.parse({userId:req.query.userId})

  if (!userId) {
    return res.status(400).json(
      new ApiResponse(400, null, "Missing userId in query parameters")
    )
  }
  try {
    const user = await prisma.user.findFirst({
      where:{
        id:userId
      },
      include: { 
        subscriptions: true 
      },
    })
    if (!user) {
      return res.status(404).json(
        new ApiResponse(404, null, "User not found")
      );
    }
    return res.status(200).json(
      new ApiResponse(200 , user , "User Data fetched successfully")
    )
  } catch (error:any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(new ApiResponse(400, error.errors, "Validation error"))
    }
    return res.status(500).json(
      new ApiResponse(500 , "Something went wrong while fetching user details" , error)
    )
  }
})

const deleteSubscription = asyncHandler (async (req:Request , res:Response)=>{
  const {userId , subscriptionId} = uuidSchema.parse({userId: req.query.userId , subscriptionId:req.query.subscriptionId})

  try {
    await prisma.subscription.delete({
      where:{
        authorId:userId,
        id:subscriptionId
      }
    })
    return res.status(200).json(
      new ApiResponse(200 , "Subscription deleted successfully")
    )
  } catch (error:any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(new ApiResponse(400, error.errors, "Validation error"))
    }
    throw new ApiError(500 , "Something went wrong " , error)
  }
})

const triggerNotification = asyncHandler (async (req:Request , res:Response)=>{
  try {
    const {subscriptionId} = uuidSchema.parse({userId:req.body.subscriptionId})
    await prisma.subscription.update({
      where:{
        id:subscriptionId
      },
      data:{
        isNotification:true
      }
    })
    return res.status(200).json(
      new ApiResponse(200 , "Notification setup successfull")
    )
  } catch (error:any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(new ApiResponse(400, error.errors, "Validation error"))
    }
    throw new ApiError(500 ,"Something went wrong while setting up notification", error)
  }
})

export {googleAuth , googleLogin , getSubscriptions , getUserDetails , deleteSubscription , triggerNotification}

// mistralai/Mixtral-8x7B-Instruct-v0.1