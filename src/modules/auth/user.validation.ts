
import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum.js";

import joi from "joi";
import { general_rules } from "../../common/utils/generalRules.js";
export const signUpSchema = {
    body:z.object({
            userName: z.string().min(1, "Name is required"),
            email: z.string().email("Invalid email address"),
            password: z.string().min(6, "Password must be at least 6 characters long"),
            cPassword: z.string().min(6, "Confirm Password must be at least 6 characters long"),
            age: z.number().min(18, "You must be at least 18 years old").max(100, "Age must be less than 100"),
                phone: z.string().optional(),
                address: z.string().optional(),
                gender: z.enum(GenderEnum).optional()
        }).superRefine(( data, ctx) => {
            if(data.password !== data.cPassword){
                ctx.addIssue({
                    code: "custom",
                    message: "Passwords don't match",
                    path: ["cPassword"]
                });
            }

        })
    
}
export const signInSchema = {
    body:z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long")
    })
}
export const forgetPasswordSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
};
export const resetPasswordSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    code: z.string().min(1, "OTP code is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    cPassword: z.string().min(6, "Confirm Password must be at least 6 characters long"),
    }).superRefine((data, ctx) => {      if (data.password !== data.cPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords don't match",
          path: ["cPassword"],
        });
      }
    }),
};


export type ISignUpType = z.infer<typeof signUpSchema.body>;
export type ISignInType = z.infer<typeof signInSchema.body>;
export type IForgetPasswordType = z.infer<typeof forgetPasswordSchema.body>;
export type IResetPasswordType = z.infer<typeof resetPasswordSchema.body>;