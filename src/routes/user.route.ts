import { Router } from "express";
import { getEmails, googleAuth, googleLogin } from "../controllers/user.controller";

const userRouter = Router()

userRouter.route("/googleOAuth").get(googleAuth)
userRouter.route("/googleLogin").post(googleLogin)
userRouter.route("/emailsData").get(getEmails)

export default userRouter