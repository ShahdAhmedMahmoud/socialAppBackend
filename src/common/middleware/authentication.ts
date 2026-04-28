
import type { NextFunction ,Request,Response} from "express";
import { AppError } from "../utils/global-error-handler.js";
import { VerifyToken } from "../utils/token.service.js";

import UserRepository from "../../DB/repositories/user.repository.js";
import { get, revoked_key } from "../../DB/redis/redis.service.js";
import { ACCESS_SECRET_KEY_ADMIN, ACCESS_SECRET_KEY_USER,PREFIX_ADMIN,PREFIX_USER } from "../../config/config.service.js";

const userRepo= new UserRepository()
export const authenticaion = async(req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  console.log(authorization);
  
  if (!authorization) {
    throw new AppError("Token not exist");
  }
  const [prefix, token]: string[] = authorization.split(" ");
  if(prefix !== prefix) {
    throw new AppError("invalid Token prefix");
  }
  if(!token){
    throw new AppError("token not found")
  }

  let ACCESS_SECRET_KEY="";
  if(prefix ==PREFIX_USER){
    ACCESS_SECRET_KEY =ACCESS_SECRET_KEY_USER!;
  }
  else if(prefix ==PREFIX_ADMIN){
    ACCESS_SECRET_KEY =ACCESS_SECRET_KEY_ADMIN!;
  }
  else{
    throw new AppError("invalid prefix")
  }
  const decoded = VerifyToken({ token, secret_key:ACCESS_SECRET_KEY! });
  if (!decoded || !decoded?.id) {
    throw new AppError("invalid Token payload");
  }
      const user = await userRepo.findOne({
        filter:{_id:decoded.id}
    
    });
    if (!user) {
      throw new AppError("user not found",400)
    }
    if(!user?.confirmed){
      throw new AppError("not confirmed yet",400);
    }

    // if(user?.changeCredentials?.getTime() > decoded.iat * 1000) {
    //   throw new AppError("Token expired, please login again");
    // }
    const isRevoked = await get(revoked_key({userId:decoded.id,jti:decoded.jti!}));
    if(isRevoked) {
      throw new AppError("Token revoked, please login again");
    }
req.user = user
req.decoded = decoded
next()
};
