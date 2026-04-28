import type { HydratedDocument } from "mongoose";
import type { IUser } from "../../DB/models/user.model.js";
import type { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core"{

    interface Request {
        user:HydratedDocument<IUser>,
        decoded:JwtPayload
    }
}