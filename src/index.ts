import express from 'express'
import connectDb from './db/connect.js'
import { app } from './app.js'
import pg from 'pg'
import fs from "fs"
import sendNotfication from './services/sendNotification.service.js'

connectDb()
.then(()=>{
  app.listen(process.env.PORT || 4000, ()=>{
    console.log("Server is running ")
  })
})

// connection with pg_notify channel to get subscription id which has renewal date after 3 days 
const config = {
  user: "avnadmin",
  password:process.env.AIVEN_PG_PASSWORD ,
  host:process.env.AIVEN_PG_HOST ,
  port: 26644,
  database: "defaultdb",
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./prisma/ca.pem").toString(),
  },
};

const client = new pg.Client(config)

client.connect()
client.query('LISTEN send_notification');
client.on("notification" , async (msg)=>{
  if(msg.channel ==="send_notification"){
    sendNotfication({subscriptionId:msg.payload})
  }
})
