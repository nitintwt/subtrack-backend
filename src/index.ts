import express from 'express'
import connectDb from './db'
import { app } from './app'

connectDb()
.then(()=>{
  app.listen(process.env.PORT || 4000, ()=>{
    console.log("Server is running ")
  })
})
