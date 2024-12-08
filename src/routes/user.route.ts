import { Router } from "express";
import { getEmails, getUserDetails, googleAuth, googleLogin } from "../controllers/user.controller";

const userRouter = Router()

userRouter.route("/googleOAuth").get(googleAuth)
userRouter.route("/googleLogin").post(googleLogin)
userRouter.route("/emailsData").get(getEmails)
userRouter.route("/userDetails").get(getUserDetails)

export default userRouter