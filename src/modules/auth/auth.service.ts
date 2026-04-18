import type { NextFunction ,Request,Response} from "express";
import UserRepository from "../../DB/repositories/user.repository.js";
import type { IUser } from "../../DB/models/user.model.js";
import { AppError } from "../../common/utils/global-error-handler.js";



class AuthService {

    private readonly _userModel = new UserRepository();
    constructor() {}

    signup = async(req:Request, res:Response, next:NextFunction) => {
        let {userName , email , password , age} = req.body;
        const user = await this._userModel.create(
            {userName,email,password,age}as Partial<IUser>);
        if(!user) {
            throw new AppError("Failed to create user", 500);
        }

        await user.save();
        res.status(201).json({ message: "User created successfully", user });
    }
}