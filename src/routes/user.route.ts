import { Router } from "express";
import { deleteSubscription, getSubscriptionsData, getUserDetails, googleAuth, googleLogin } from "../controllers/user.controller";

const userRouter = Router()

userRouter.route("/googleOAuth").get(googleAuth)
userRouter.route("/googleLogin").post(googleLogin)
userRouter.route("/subscriptionsData").get(getSubscriptionsData)
userRouter.route("/userDetails").get(getUserDetails)
userRouter.route("/deleteSubscription").delete(deleteSubscription)

export default userRouter