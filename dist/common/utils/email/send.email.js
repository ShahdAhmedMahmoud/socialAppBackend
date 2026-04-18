import nodemailer from "nodemailer";
import { EMAIL, PASSWORD } from "../../../config/config.service.js";
export const sendEmail = async (mailOptions) => {
    console.log("EMAIL:", EMAIL);
    console.log("PASSWORD:", PASSWORD ? "loaded" : "not loaded");
    console.log("Sending email to:", mailOptions.to);
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        from: `"Sarah App" <${EMAIL}>`,
        ...mailOptions,
    });
    console.log("Full info:", info);
    console.log("Message sent:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    return info.accepted.length > 0 ? true : false;
};
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
};
