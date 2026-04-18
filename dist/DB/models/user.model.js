import mongoose, { Types } from "mongoose";
import { GenderEnum, RoleEnum, ProviderEnum } from "../../common/enum/user.enum.js";
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, minlength: 3, maxlength: 50 },
    lastName: { type: String, required: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    phone: { type: String },
    address: { type: String },
    confirmed: { type: Boolean },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    provider: { type: String, enum: ProviderEnum, default: ProviderEnum.LOCAL },
}, { timestamps: true, strictQuery: true, strict: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`;
}).set(function (value) {
    this.set({ "firstName": value.split(" ")[0], "lastName": value.split(" ")[1] });
});
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export default UserModel;
