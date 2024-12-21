import { prisma } from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from "zod";

const signupSchema = z.object({
  name:z.string(),
  email: z.string().email(),
  password: z.string().min(8)
})

const loginSchema = z.object({
  email:z.string().email(),
  password: z.string().min(8)
})

const generateAccessAndRefreshToken = async (userId:string , email:string , name:string)=>{
  try {
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
  } catch (error:any) {
    throw new ApiError(500 , "Something went wrong while creating access token" , error)
  }
}

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body)

    const existedUser = await prisma.user.findFirst({
      where: {
        email: email,
      }
    })

    if (existedUser) {
      return res.status(409).json(
        new ApiResponse(409, "User with this email already exists.")
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
    if (error instanceof z.ZodError) {
      return res.status(400).json(new ApiResponse(400, error.errors, "Validation error"))
    }
    console.error("Error registering user:", error)
    throw new ApiError(500, "Something went wrong registering the user.", error)
  }
})

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json(
        new ApiResponse(404, null, "User with this email does not exist")
      )
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if (!isPasswordCorrect) {
      return res.status(401).json(
        new ApiResponse(401, null, "Incorrect password.")
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
    if (error instanceof z.ZodError) {
      return res.status(400).json(new ApiResponse(400, error.errors, "Validation error."))
    }
    console.error("Error logging in user:", error)
    throw new ApiError(500, "Something went wrong logging in the user.", error)
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
    throw new ApiError(500 , "Something went wrong" , error)
  }
})

export {registerUser , loginUser, logoutUser}