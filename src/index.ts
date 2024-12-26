import express from 'express'
import connectDb from './db'
import { app } from './app'
import pg from 'pg'
import fs from "fs"

connectDb()
.then(()=>{
  app.listen(process.env.PORT || 4000, ()=>{
    console.log("Server is running ")
  })
})


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
  }
})
