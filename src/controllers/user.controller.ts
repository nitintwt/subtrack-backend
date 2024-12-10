import { google } from "googleapis";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../db";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";
import PdfParse from "pdf-parse";


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
  const userId= req.body.userId as string

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

/*
 The pdf which we get from the gmail api will in base64 form.
 Base64 is way text based way to represent binary data.
 for example: Binary:01001000 01100101 01101100 01101100 01101111 
              Base64: SGVsbG8=
  gmail response  the pdf in base64 format.
  First we will convert this base64 back to binary form using nodejs buffer.
  Then this binary form will be passed to pdf-parser which will convert it into text
*/

const getEmails = asyncHandler (async (req:Request , res:Response)=>{
  const userId = req.query.userId as string

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
  );

  oauth2Client.setCredentials(tokens)

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Format the date in YYYY/MM/DD
    const formattedDate = `${oneYearAgo.getFullYear()}/${(oneYearAgo.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${oneYearAgo.getDate().toString().padStart(2, "0")}`;
    
    const searchQuery = `subject:receipt OR subject:invoice after:${formattedDate}`;
    const listResponse = await gmail.users.messages.list({
      userId: "me",   // the authorized user
      q: searchQuery,
    });

    const emails = listResponse.data.messages;

    if (!emails || emails.length === 0) {
      return res.status(200).json({ message: "No emails found with the given subject." });
    }
    console.log("EMAIL" , emails)

    // Fetch attachments for each message
    const emailAttachments = await Promise.all(
      emails.map(async (email:any) => {
        const messageDetails = await gmail.users.messages.get({
          userId: "me",
          id: email.id,
        });

        const parts = messageDetails.data.payload?.parts || [];

        // Extract attachments from email parts
        const attachments = await Promise.all(
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

              //console.log("text" , pdfText)
            
              return {
                filename: attachment.filename,
                mimeType: attachment.mimeType,
                data: attachmentData,
                pdfText:pdfText
              };
            })
        );

        return {
          messageId: email.id,
          threadId: email.threadId,
          attachments: attachments.filter(Boolean), // Only include non-null attachments
        };
      })
    );
    console.log("emailattach" , emailAttachments)
    return res.status(200).json({ emailAttachments });
  } catch (error:any){
    throw new ApiError (500 ,  error)
  }
})

const getUserDetails = asyncHandler (async (req:Request , res:Response)=>{
  const userId = req.query.userId as string

  if (!userId) {
    return res.status(400).json(
      new ApiResponse(400, null, "Missing userId in query parameters")
    )
  }
  try {
    const user = await prisma.user.findFirst({
      where:{
        id:userId
      }
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
    return res.status(500).json(
      new ApiResponse(500 , "Something went wrong while fetching user details" , error)
    )
  }
})

export {googleAuth , googleLogin , getEmails , getUserDetails}