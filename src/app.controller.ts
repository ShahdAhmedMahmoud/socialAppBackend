import express from "express";
import type { Request,Response,NextFunction } from "express";
import cors from "cors";

import ratelimit from "express-rate-limit";
import helmet from "helmet";
import { PORT } from "./config/config.service.js";
import { AppError, globalErrorHandler } from "./common/utils/global-error-handler.js";
import authRouter from "./modules/auth/user.controller.js";
import { checkConnectionDB } from "./DB/connectionDB.js";
import { redisConnection } from "./DB/redis/redis.db.js";
const app: express.Application = express();
const port: number = Number(PORT);
const bootstrap = () => {
    const limiter = ratelimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
        message: "Too many requests from this IP, please try again after 15 minutes",
        handler: (req:Request, res:Response, next:NextFunction) => {
           throw new AppError("Too many requests from this IP, please try again after 15 minutes", 429);
        },
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
    app.use(express.json());
    app.use(cors(),helmet(), limiter);
    checkConnectionDB();
    redisConnection();
    app.use("/auth", authRouter);
    app.get("/", (req:Request, res:Response, next:NextFunction) => {
        res.status(200).json({ message: "Welcome to the Social App API!" });
    });
    app.use("{/*demo}", (req:Request, res:Response, next:NextFunction) => {
        throw new AppError("Route not found", 404);
    });
    app.use(globalErrorHandler);
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
};
export default bootstrap;
