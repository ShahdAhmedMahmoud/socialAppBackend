import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../common/utils/global-error-handler.js";
import UserRepository from "../../DB/repositories/user.repository.js";
import { encrypt } from "../../common/utils/security/encrypt.js";
import { Compare, Hash } from "../../common/utils/security/hash.js";
import { GenerateToken } from "../../common/utils/token.service.js";
import { ACCESS_SECRET_KEY } from "../../config/config.service.js";
import { generateOTP, sendEmail } from "../../common/utils/email/send.email.js";
import { emailTemplate } from "../../common/utils/email/email.templete.js";
import { eventEmitter } from "../../common/utils/email/email.events.js";
import { emailEnum } from "../../common/enum/email.enum.js";
import { block_otp_key, del, get, incr, max_otp_key, otp_key, set, ttl } from "../../DB/redis/redis.service.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
const GOOGLE_CLIENT_ID = "1027986971476-b2pq7iu1kpu6s0tna24kqsub53b6jgi3.apps.googleusercontent.com";
class UserService {
    _userModel = new UserRepository();
    constructor() { }
    signUp = async (req, res, next) => {
        const { userName, email, password, age, phone, address, gender } = req.body;
        const existingUser = await this._userModel.findOne({ filter: { email } });
        if (existingUser) {
            throw new AppError("Email already exists", 409);
        }
        const user = await this._userModel.create({
            userName,
            email,
            password: Hash({ plainText: password }),
            age,
            phone: phone ? encrypt(phone) : null,
            address,
            gender,
        });
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
    signIn = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            return next(new AppError("Invalid email or password", 401));
        }
        const isMatch = Compare({ plainText: password, cipherText: user.password });
        if (!isMatch) {
            return next(new AppError("Invalid email or password", 400));
        }
        const token = GenerateToken({
            payload: { id: user._id.toString(), email: user.email },
            secret_key: ACCESS_SECRET_KEY,
            options: { expiresIn: "1d" },
        });
        const { password: _, ...userData } = user.toObject();
        return res.status(200).json({
            message: "User signed in successfully",
            token,
            data: userData,
        });
    };
    confirmEmail = async (req, res, next) => {
        try {
            const { email, code } = req.body;
            const otpExist = await get(otp_key({ email, subject: emailEnum.confirmEmail }));
            console.log(otpExist, "otp exist");
            if (!otpExist) {
                throw new Error("OTP expired");
            }
            if (typeof otpExist !== "string") {
                throw new Error("invalid OTP format");
            }
            if (!Compare({ plainText: code, cipherText: otpExist })) {
                throw new Error("invalid OTP");
            }
            const user = await this._userModel.findOneAndUpdate({
                filter: { email },
                update: { confirmed: true },
            });
            if (!user) {
                throw new Error("user not exist");
            }
            await del(otp_key({ email, subject: emailEnum.confirmEmail }));
            res.status(201).json({ message: "email confirmed" });
        }
        catch (error) {
            throw new AppError(error.message, 400);
        }
    };
    signupWithGmail = async (req, res, next) => {
        try {
            const { idToken } = req.body;
            const client = new OAuth2Client();
            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new AppError("Invalid Google token", 400);
            }
            const { email, email_verified, name, picture } = payload;
            let user = await this._userModel.findOne({ filter: { email } });
            if (!user) {
                user = await this._userModel.create({
                    email,
                    confirmed: email_verified,
                    userName: name,
                    provider: ProviderEnum.google,
                });
            }
            if (user.provider === ProviderEnum.system) {
                throw new AppError("Please log in with system credentials only", 400);
            }
            const access_token = GenerateToken({
                payload: { id: user._id.toString(), email: user.email },
                secret_key: ACCESS_SECRET_KEY,
                options: { expiresIn: "1d" },
            });
            res.status(201).json({ message: "success login", data: { access_token } });
        }
        catch (error) {
            next(error instanceof AppError ? error : new AppError(error.message, 400));
        }
    };
    sendEmailOtp = async ({ email, subject }) => {
        const isBlocked = await ttl(block_otp_key({ email }));
        if (isBlocked > 0) {
            throw new Error(`You have been blocked from requesting OTP, please try again after ${isBlocked} seconds`);
        }
        const ttlOtp = await ttl(otp_key({ email, subject }));
        if (ttlOtp > 0) {
            throw new Error(`OTP already sent, please wait ${ttlOtp} seconds before requesting a new one`);
        }
        const maxTries = await get(max_otp_key({ email }));
        if (maxTries !== null && maxTries !== undefined && maxTries >= 3) {
            await set({ key: block_otp_key({ email }), value: 1, ttl: 60 * 5 });
            throw new Error(`You have exceeded the maximum number of OTP requests, please try again after 5 minutes`);
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
    forgetPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
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
        }
        catch (error) {
            next(error instanceof AppError ? error : new AppError(error.message, 400));
        }
    };
}
export default new UserService();
