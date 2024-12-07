import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export default async function connectDb () {
  try {
    await prisma.$connect()
    console.log("Db connected successfully")
  } catch (error) {
    console.log("Something went wrong while connnecting with db" , error)
  }
}

export {prisma}