import { tryCatch, Worker } from "bullmq";
import { prisma } from "../db/connect.js"
import nodemailer from 'nodemailer';
import dotenv from 'dotenv'

export const notifyUsers = async (id:string) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where:{
        id:id
      }
    })
  } catch (error) {
    console.error("Something went wrong while sending reminder")
  }

};
/*
CREATE OR REPLACE FUNCTION notify_backend()
RETURNS void AS $$
DECLARE
  subscription RECORD;
BEGIN
  FOR subscription IN
    SELECT "id"
    FROM "Subscription"
    WHERE "isNotification" = true
      AND (
        CASE
          WHEN "frequency" = 'monthly' THEN
            TO_DATE("lastRenewalDate", 'MM/DD/YYYY') 
            + INTERVAL '1 month' * FLOOR(EXTRACT(MONTH FROM AGE(CURRENT_DATE, TO_DATE("lastRenewalDate", 'MM/DD/YYYY'))) + 1)
          WHEN "frequency" = 'yearly' THEN
            TO_DATE("lastRenewalDate", 'MM/DD/YYYY') 
            + INTERVAL '1 year' * FLOOR(EXTRACT(YEAR FROM AGE(CURRENT_DATE, TO_DATE("lastRenewalDate", 'MM/DD/YYYY'))) + 1)
          ELSE NULL
        END
      ) = CURRENT_DATE + INTERVAL '3 days'
  LOOP
    -- Use pg_notify to send subscription ID
	RAISE NOTICE 'Found matching subscription: %', subscription.id;
    PERFORM pg_notify('send_notification', subscription.id::text);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT notify_backend();

SELECT cron.schedule(
  'daily_subscription_check',  -- Job name
  '0 8 * * *',                 -- Cron schedule: 8 AM daily
  $$ SELECT notify_backend(); $$ -- SQL command to execute
);

SELECT * FROM cron.job;

SELECT cron.alter_job(1, schedule => '39 21 * * *');

*/

const emailWorker = new Worker("subtrack-email-queue", async(job)=>{
  const data = job.data
  console.log("Job" , data)
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    })

    const mailConfigs = {
      from: process.env.EMAIL_USER,
      to: "ns809203@gmail.com",
      subject: `Renewal of your ${data.service} subscription`,
      text: 
      `Hello ${data.name},
      We hope that you are doing well! This is a friendly reminder that your subscription , ${data.service}, is set to renew in days.
       ${data.amount} will be deducted from your account.
      `
    }
    await transporter.sendMail(mailConfigs)
  } catch (error) {
    console.error(`Error in Job ID ${job.id}:`, error)
  }
},{
  connection:{
    host:process.env.AIVEN_HOST,
    port:26644,
    username:process.env.AIVEN_USERNAME,
    password:process.env.AIVEN_PASSWORD ,
  },
  limiter: {
    max: 50,
    duration: 10 * 1000
  }
})

export{emailWorker}
