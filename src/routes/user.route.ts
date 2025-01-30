import { Router } from "express";
import { deleteSubscription, getSubscriptions, getUserDetails, googleAuth, googleLogin, startNotification, stopNotification } from "../controllers/user.controller.js";

const userRouter = Router()

userRouter.route("/googleOAuth").get(googleAuth)
userRouter.route("/googleLogin").post(googleLogin)
userRouter.route("/subscriptions").get(getSubscriptions)
userRouter.route("/userDetails").get(getUserDetails)
userRouter.route("/subscription").delete(deleteSubscription)
userRouter.route("/startNotification").put(startNotification)
userRouter.route("/stopNotification").put(stopNotification)

export default userRouter