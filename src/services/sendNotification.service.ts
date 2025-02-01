import {Queue, tryCatch} from "bullmq"
import { prisma } from "../db/connect.js";

const emailQueue = new Queue("subtrack-email-queue" , {
  connection: {
    host:process.env.AIVEN_HOST,
    port:26644,
    username:process.env.AIVEN_USERNAME,
    password:process.env.AIVEN_PASSWORD ,
  },
})

const sendNotfication = async ({subscriptionId})=>{
  console.log(subscriptionId)
  try {
    const subscription = await prisma.subscription.findFirst({
      where:{
        id:subscriptionId
      },
      include:{
        author:true
      }
    })
    const job =await emailQueue.add(`${subscription.author.email}`, {email:subscription.author.email , name:subscription.author.name , service:subscription.service , amount:subscription.amount})
    console.log("job",job)
  } catch (error) {
    console.log("Something went wrong while sending email" , error)
  }
}

export default sendNotfication