import express from 'express'
import connectDb from './db/connect.js'
import { app } from './app.js'
import pg from 'pg'
import fs from "fs"
import { notifyUsers } from './controllers/notify.controller.js'

connectDb()
.then(()=>{
  app.listen(process.env.PORT || 4000, ()=>{
    console.log("Server is running ")
  })
})

// connection with pg_notify channel to get subscription id which has renewal date after 3 days 
const config = {
  user: "avnadmin",
  password:process.env.AIVEN_PASSWORD ,
  host:process.env.AIVEN_HOST ,
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
    console.log(`Received subscription id ${msg.payload}`)
    notifyUsers(msg.payload!)
  }
})
