import mongoose, { Types, type HydratedDocument } from "mongoose";
import { GenderEnum, RoleEnum, ProviderEnum } from "../../common/enum/user.enum.js";
import { Hash } from "../../common/utils/security/hash.js";
import { generateOTP, sendEmail } from "../../common/utils/email/send.email.js";
import { eventEmitter } from "../../common/utils/email/email.events.js";
import { emailEnum } from "../../common/enum/email.enum.js";
import { emailTemplate } from "../../common/utils/email/email.templete.js";
import { incr, max_otp_key, otp_key, set } from "../redis/redis.service.js";


export interface IUser {
    _id:Types.ObjectId;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    password?: string;
    age?: number;
    phone?: string;
    address?: string;
    confirmed?: boolean;
    role?:RoleEnum;
    gender?:GenderEnum;
    provider?:ProviderEnum;
    createdAt: Date;
    updatedAt: Date;
}



const userSchema = new mongoose.Schema<IUser>({
    firstName: { type: String, required: true ,minlength:3, maxlength:50},
    lastName: { type: String, required: true ,minlength:3, maxlength:50},
    email: { type: String, required: true, unique: true },
    password: { type: String },
    age: { type: Number },
    phone: { type: String },
    address: { type: String },
    confirmed: { type: Boolean },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male},
    provider: { type: String, enum: ProviderEnum, default: ProviderEnum.system },
}, { timestamps: true,strictQuery:true, strict: true ,toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`;
}).set(function ( value: string) {
   this.set({"firstName": value.split(" ")[0],"lastName": value.split(" ")[1]});
});

// userSchema.pre("updateOne",{document:true,query:false},function(){
//     console.log("----pre update hook-----");
//     console.log(this);
// })

// userSchema.pre("save",function(this:HydratedDocument<IUser> & {is_new:boolean}){
//     console.log("-----pre hook-----")
//     console.log(this.isNew);
//     this.is_new=this.isNew
//     if(this.isModified("password")){
//         this.password=Hash({plainText:(this.password)!})
//     }
    
// })
// userSchema.post("save",async function(){
//     console.log("---------post hook--------------");
//     let that = this as HydratedDocument<IUser> & {is_new:boolean}
//     console.log(that.is_new); 

//     if(that.is_new){
             
//       const otp = await generateOTP();
//       eventEmitter.emit(emailEnum.confirmEmail, async () => {
//         await sendEmail({
//           to: this.email,
//           subject:"halloooo from social app",
//           html: emailTemplate(otp),
//         });

//       }); 
        
//     }
//     // console.log(this.isNew);

// })


const UserModel =mongoose.models.User ||mongoose.model<IUser>("User", userSchema);

export default UserModel;
