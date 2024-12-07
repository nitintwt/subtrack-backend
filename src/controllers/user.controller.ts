import { google } from "googleapis";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../db";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";

// generated a endpoint for the google oauth2 and redirect user to it for authentication
const googleAuth = asyncHandler (async (req:Request , res:Response)=>{
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  const scopes = ['https://www.googleapis.com/auth/gmail.addons.current.message.readonly']
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
   throw new ApiError(500 , "Something went wrong. Try login again" , error)
  }
})

const getEmails = asyncHandler (async (req:Request , res:Response)=>{
  const userId = req.body.userId

  const user = await prisma.user.findFirst({
    where:{
      id:userId
    }
  })

  const tokens = JSON.parse(user!.tokens)   // "!" , confirms that token will exist , for typescript error resolve

  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );

  oauth2Client.setCredentials(tokens)

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const searchQuery = "subject:receipt OR subject:invoice";
    const listResponse = await gmail.users.messages.list({
      userId: "me",   // the authorized user
      q: searchQuery,
    });

    const messages = listResponse.data.messages;

    if (!messages || messages.length === 0) {
      return res.status(200).json({ message: "No emails found with the given subject." });
    }
    console.log("EMAIL" , messages)
  } catch (error:any){
    throw new ApiError (500 , "Something went wrong while fetching emails" )
  }
})

export {googleAuth , googleLogin , getEmails}