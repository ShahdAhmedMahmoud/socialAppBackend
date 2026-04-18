import e from "express";


export const emailEnum = {
  forgetPassword: "Forget Password",
    confirmEmail: "Confirm Email",
    
} as const;
export type EmailEnum = typeof emailEnum[keyof typeof emailEnum];
