import UserRepository from "../../DB/repositories/user.repository.js";
import { AppError } from "../../common/utils/global-error-handler.js";
class AuthService {
    _userModel = new UserRepository();
    constructor() { }
    signup = async (req, res, next) => {
        let { userName, email, password, age } = req.body;
        const user = await this._userModel.create({ userName, email, password, age });
        if (!user) {
            throw new AppError("Failed to create user", 500);
        }
        await user.save();
        res.status(201).json({ message: "User created successfully", user });
    };
}
