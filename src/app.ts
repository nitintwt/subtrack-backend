import express , {Request , Response} from 'express'
import cors from 'cors'

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials:true,
}))

app.use(express.json({limit:'16kb'}))  // setting a limit of json , like how much json data can be sent to backend 
app.use(express.urlencoded({extended: true , limit:"16kb"}))   // setting a limit to url data 

app.get("/" , (req, res):any =>{
  return res.status(200).json({
    message: "Going good"
  })
})

export {app}
