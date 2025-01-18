import { prisma } from "../db/connect.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response } from "express";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from "zod";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5 , "Name must be at least 5 characters long")
    .max(30 , "Name must be at most 30 characters long")
    .regex(/^[a-zA-Z\s\-']+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .trim()
    .email("Invalid email format"),
  password: z
    .string()
    .trim()
    .min(8 , "Password must be at least 8 characters long")
    .max(20 , "Password must be at most 20 characters long")
})

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email format"),
  password: z
    .string()
    .trim()
    .min(8 , "Password must be at least 8 characters long")
    .max(20 , "Password must be at most 20 characters long")
})

const generateAccessAndRefreshToken = async (userId:string , email:string , name:string)=>{
    const accessToken = jwt.sign(
      {
      id:userId,
      email,
      name
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
      }
    )
  
    const refreshToken = jwt.sign(
      {
        id:userId
      },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
    )
    return {accessToken , refreshToken}
}

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(409).json(
        {message: parseResult.error.issues[0].message }
      )
    }
  
    const {name , email , password}= parseResult.data

    const existedUser = await prisma.user.findFirst({
      where: {
        email: email,
      }
    })

    if(existedUser){
      return res.status(409).json(
        {message: "User with this email already exists"}
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return res.status(201).json(
      new ApiResponse(201, "User registered successfully.")
    )
  } catch (error: any) {
    console.error("Register error" , error)
    return res.status(500).json(
      {message: error.message}
    )
  }
})

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(409).json(
        {message: parseResult.error.issues[0].message }
      )
    }
  
    const {email , password}= parseResult.data

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json(
        {message: "User doesn't exist" }
      )
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if (!isPasswordCorrect) {
      return res.status(401).json(
        {message: "Password is incorrect" }
      )
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user.id,
      email,
      user.name
    )

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: refreshToken,
      }
    })

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, user, "User logged in successfully."))
  } catch (error: any) {
    console.error("Login error" , error)
    return res.status(500).json(
      {message: error.message}
    )
  }
})

const logoutUser = asyncHandler(async(req:Request , res:Response)=>{
  const userId = req.body.userId
  try {
    await prisma.user.update({
      where:{
        id:userId,
      },
      data:{
        refreshToken:null
      }
    })
    const options ={
      httpOnly:false,
      secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("RefreshToken", options)
    .clearCookie("userData")
    .json(
      new ApiResponse(200 , "User logged out successfully")
    )
  } catch (error:any) {
    console.error("Logout error" , error)
    return res.status(500).json(
      {message:error.message}
    )
  }
})

export {registerUser , loginUser, logoutUser}