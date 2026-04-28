
import type { NextFunction, Request, Response } from "express";
import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../DB/models/user.model.js";
import type { ISignUpType, ISignInType } from "./user.validation.js";

import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../common/utils/global-error-handler.js";
import UserRepository from "../../DB/repositories/user.repository.js";
import { encrypt } from "../../common/utils/security/encrypt.js";
import { Compare, Hash } from "../../common/utils/security/hash.js";
import { GenerateToken } from "../../common/utils/token.service.js";
import { ACCESS_SECRET_KEY_ADMIN, ACCESS_SECRET_KEY_USER, REFRESH_SECRET_KEY_ADMIN, REFRESH_SECRET_KEY_USER } from "../../config/config.service.js";
import { generateOTP, sendEmail } from "../../common/utils/email/send.email.js";
import { emailTemplate } from "../../common/utils/email/email.templete.js";
import { eventEmitter } from "../../common/utils/email/email.events.js";
import { emailEnum, type EmailEnum } from "../../common/enum/email.enum.js";
import { block_otp_key, del, get, incr, max_otp_key, otp_key, set, ttl } from "../../DB/redis/redis.service.js";
import { ProviderEnum, RoleEnum } from "../../common/enum/user.enum.js";
import { randomUUID } from "node:crypto";



const GOOGLE_CLIENT_ID = "1027986971476-b2pq7iu1kpu6s0tna24kqsub53b6jgi3.apps.googleusercontent.com";

interface GooglePayload {
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
}

class UserService {
  private readonly _userModel = new UserRepository();

  constructor() {}

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    const { userName, email, password, age, phone, address, gender }: ISignUpType = req.body;

    const existingUser = await this._userModel.findOne({ filter: { email } });
    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    const user: HydratedDocument<IUser> = await this._userModel.create({
      userName,
      email,
      password: Hash({ plainText: password }),
      age,
      phone: phone ? encrypt(phone) : null,
      address,
      gender,
    } as Partial<IUser>);

    const otp = await generateOTP();
    eventEmitter.emit(emailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Email Confirmation",
        html: emailTemplate(otp),
      });
      await set({
        key: otp_key({ email, subject: emailEnum.confirmEmail }),
        value: Hash({ plainText: `${otp}` }),
        ttl: 60 * 2,
      });
      await set({ key: max_otp_key({ email }), value: 1, ttl: 30 });
    });
    res.status(200).json({ message: "User signed up successfully!", data: user });
  };
    confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, code } = req.body;
      const otpExist = await get<string>(otp_key({ email, subject: emailEnum.confirmEmail }));
      console.log(otpExist, "otp exist");
      if (!otpExist) {
        throw new Error("OTP expired"); }
      if (typeof otpExist !== "string") {
        throw new Error("invalid OTP format");}
      if (!Compare({ plainText: code, cipherText: otpExist })) {
        throw new Error("invalid OTP");}
      const user = await this._userModel.findOneAndUpdate({
        filter: { email },
        update: { confirmed: true },
      });
      if (!user) {
        throw new Error("user not exist");
      }
      await del(otp_key({ email, subject: emailEnum.confirmEmail }));
      res.status(201).json({ message: "email confirmed" });
    } catch (error) {
      throw new AppError((error as Error).message, 400);
    }
  };

  signIn = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: ISignInType = req.body;

    const user = await this._userModel.findOne({ filter: { email } });
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    const isMatch = Compare({ plainText: password, cipherText: user.password });
    if (!isMatch) {
      return next(new AppError("Invalid email or password", 400));
    }

    const uuid =randomUUID()


    const access_token = GenerateToken({
      payload: { id: user._id.toString(), email: user.email },
      secret_key:user?.role==RoleEnum.user? ACCESS_SECRET_KEY_USER! :ACCESS_SECRET_KEY_ADMIN! ,
      options: { expiresIn: "1d", jwtid:uuid },
    });
    const refresh_token = GenerateToken({
      payload: { id: user._id.toString(), email: user.email },
      secret_key:user?.role==RoleEnum.user? REFRESH_SECRET_KEY_USER! :REFRESH_SECRET_KEY_ADMIN! ,
      options: { expiresIn: "1d", jwtid:uuid },
    });

    const { password: _, ...userData } = user.toObject();

    return res.status(200).json({
      message: "User signed in successfully",
      data: {userData,
      access_token,
      refresh_token }


    });
  };
  signInWithGmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body as { idToken: string };

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError("Invalid Google token", 400);
    }

    const { email, email_verified, name, picture } = payload as unknown as GooglePayload;

    let user = await this._userModel.findOne({ filter: { email } });

    if (!user) {
      user = await this._userModel.create({
        email,
        confirmed: email_verified,
        userName: name,
        provider: ProviderEnum.google,
      } as Partial<IUser>);
    }

    if (user.provider === ProviderEnum.system) {
      throw new AppError("Please log in with system credentials only", 400);
    }

    const uuid = randomUUID();

    const access_token = GenerateToken({
      payload: { id: user._id.toString(), email: user.email },
      secret_key: user?.role == RoleEnum.user ? ACCESS_SECRET_KEY_USER! : ACCESS_SECRET_KEY_ADMIN!,
      options: { expiresIn: "1d", jwtid: uuid },
    });

    const refresh_token = GenerateToken({
      payload: { id: user._id.toString(), email: user.email },
      secret_key: user?.role == RoleEnum.user ? REFRESH_SECRET_KEY_USER! : REFRESH_SECRET_KEY_ADMIN!,
      options: { expiresIn: "1d", jwtid: uuid },
    });

    const { password: _, ...userData } = user.toObject();

    return res.status(200).json({
      message: "User signed in successfully",
      data: {
        userData,
        access_token,
        refresh_token,
      },
    });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError((error as Error).message, 400));
  }
};


  getProfile = async (req: Request, res: Response, next: NextFunction) => {

    return res.status(200).json({
      message: "User signed in successfully",
    
      data: {user:req.user},
    });
  };

  resetpassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, password } = req.body;
    const otpExist = await get<string>(
      otp_key({ email, subject: emailEnum.forgetPassword }),
    );
   
    if (!otpExist) {
      throw new Error("OTP expired");
    }
    if (!Compare({ plainText: code, cipherText: otpExist })) {
      throw new Error("invalid OTP");
    }
    const user = await this._userModel.findOneAndUpdate({
      
      filter: {
        email,
        confirmed: { $exists: true },
        provider: ProviderEnum.system,
      },
      update: {
        password: Hash({ plainText: password }),
        changeCredentials: Date.now(),
      },
    });
    if (!user) {
      throw new Error("user not exist");
    }
    await del(otp_key({ email, subject: emailEnum.forgetPassword }));

    res.status(201).json({ message: "password reset successfully" });
  } catch (error) {
    throw new AppError((error as Error).message, 400);
  }
};

  signupWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body as { idToken: string };

      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError("Invalid Google token", 400);
      }
      const { email, email_verified, name, picture } = payload as unknown as GooglePayload;

      let user = await this._userModel.findOne({ filter: { email } });

      if (!user) {
        user = await this._userModel.create({
          email,
          confirmed: email_verified,
          userName: name,
          provider: ProviderEnum.google,
        } as Partial<IUser>);
      }
      if (user.provider === ProviderEnum.system) {
        throw new AppError("Please log in with system credentials only", 400);
      }
      const access_token = GenerateToken({
        payload: { id: user._id.toString(), email: user.email },
        secret_key: user?.role==RoleEnum.user? ACCESS_SECRET_KEY_USER! :ACCESS_SECRET_KEY_ADMIN! ,
        options: { expiresIn: "1d" },
      });
      const refresh_token = GenerateToken({
        payload: { id: user._id.toString(), email: user.email },
        secret_key: user?.role==RoleEnum.user? REFRESH_SECRET_KEY_USER! :REFRESH_SECRET_KEY_ADMIN! ,
        options: { expiresIn: "1d" },
      });

      res.status(201).json({ message: "success login", data: { access_token , refresh_token} });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError((error as Error).message, 400));
    }
  };
   sendEmailOtp = async ({ email, subject }: { email: string; subject: EmailEnum }): Promise<void> => {
  const isBlocked = await ttl(block_otp_key({ email }));
  if (isBlocked! > 0) {
    throw new Error(
      `You have been blocked from requesting OTP, please try again after ${isBlocked} seconds`
    );
  }
  const ttlOtp = await ttl(otp_key({ email, subject }));
  if (ttlOtp! > 0) {
    throw new Error(
      `OTP already sent, please wait ${ttlOtp} seconds before requesting a new one`
    );
  }
  const maxTries = await get<number>(max_otp_key({ email }));
  if (maxTries !== null && maxTries !== undefined && maxTries as number >= 3) {
    await set({ key: block_otp_key({ email }), value: 1, ttl: 60 * 5 });
    throw new Error(
      `You have exceeded the maximum number of OTP requests, please try again after 5 minutes`
    );
  }
  const otp = await generateOTP();
  eventEmitter.emit(emailEnum.confirmEmail, async () => {
    await sendEmail({
      to: email,
      subject,
      html: emailTemplate(otp),
    });
    await set({
      key: otp_key({ email, subject }),
      value: Hash({ plainText: `${otp}` }),
      ttl: 60 * 2,
    });
    await incr(max_otp_key({ email }));
  });
};

forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email: string };

    const user = await this._userModel.findOne({
      filter: {
        email,
        confirmed: { $exists: true },
        provider: ProviderEnum.system,
      },
    });

    if (!user) {
      throw new AppError("user not exist", 404);
    }

    await this.sendEmailOtp({ email, subject: emailEnum.forgetPassword });

    res.status(201).json({ message: "OTP sent to email" });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError((error as Error).message, 400));
  }
};



}

export default new UserService();