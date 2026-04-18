import type { Model } from "mongoose";
import type { IUser } from "../models/user.model.js";
import UserModel from "../models/user.model.js";
import BaseRepository from "./base.repository.js";


class UserRepository extends BaseRepository<IUser> {
    constructor(protected readonly model: Model<IUser> = UserModel) {
        super(model);
    }
    
}

export default UserRepository;