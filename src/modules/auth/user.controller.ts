import { Router } from "express";
import UserService from "./user.service.js";
import * as UV from "./user.validation.js"; 
import { validation } from "../../common/middleware/validation.js";
import { authenticaion } from "../../common/middleware/authentication.js";
import multerCloud from './../../common/middleware/multer.cloud.js';
import { storage_enum } from "../../common/enum/multer.enum.js";
const authRouter = Router();
authRouter.post("/signup",validation(UV.signUpSchema) ,UserService.signUp);
authRouter.post("/signin", validation(UV.signInSchema), UserService.signIn);
authRouter.patch("/confirm-email", UserService.confirmEmail);
authRouter.post("/signup/gmail", UserService.signupWithGmail);
authRouter.post("/signin/gmail", UserService.signInWithGmail);
authRouter.patch(
  "/forget-password",
  validation(UV.forgetPasswordSchema),
  UserService.forgetPassword,
);
authRouter.patch(
  "/reset-password",
  validation(UV.resetPasswordSchema),
  UserService.resetpassword,
);
authRouter.get("/profile",authenticaion,UserService.getProfile)

authRouter.post("/upload",multerCloud({storage_type:storage_enum.memory}).array("attachments"),UserService.uploadImage)

export default authRouter;