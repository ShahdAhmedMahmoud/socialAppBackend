import UserModel from "../models/user.model.js";
import BaseRepository from "./base.repository.js";
class UserRepository extends BaseRepository {
    model;
    constructor(model = UserModel) {
        super(model);
        this.model = model;
    }
}
export default UserRepository;
