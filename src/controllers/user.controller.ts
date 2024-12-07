import { google } from "googleapis";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../db";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Request, Response } from "express";
import { json } from "stream/consumers";

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

const googleLogin= asyncHandler(async (req:Request , res:Response)=>{
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
   .json(new ApiResponse (200 , tokens, 'Login successfull!!'))
  } catch (error:any) {
   throw new ApiError(500 , "Something went wrong. Try login again" , error)
  }
})

const getEmailData = asyncHandler (async (req:Request , res:Response)=>{
  
})