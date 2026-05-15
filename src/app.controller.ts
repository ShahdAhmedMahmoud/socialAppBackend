import express from "express";
import type { Request,Response,NextFunction } from "express";
import cors from "cors";
import multer from "multer"

import ratelimit from "express-rate-limit";
import helmet from "helmet";
import { PORT } from "./config/config.service.js";
import { AppError, globalErrorHandler } from "./common/utils/global-error-handler.js";
import authRouter from "./modules/auth/user.controller.js";
import { checkConnectionDB } from "./DB/connectionDB.js";
import { redisConnection } from "./DB/redis/redis.db.js";
import UserModel from "./DB/models/user.model.js";
import { S3Service } from "./common/service/s3.service.js";
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { createHandler } from "graphql-http/lib/use/express";
import {pipeline} from "stream/promises"
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

//    async function test (){

//         let user = new UserModel({
//             userName:"Shahd Ahmed",
//             email:`Shahd${Date.now()}@gmail.com`,
//             password:123456789

//         })
     
//         await user.save()
//         // await user.updateOne({})
//         user.userName="Shosho Ahmed"
//         await user.save()

//     }
//     test()


    checkConnectionDB();
    redisConnection();
    app.use("/auth", authRouter);
    app.get("/", (req:Request, res:Response, next:NextFunction) => {
        res.status(200).json({ message: "Welcome to the Social App API!" });
    });

    const schema = new GraphQLSchema({
        query:new GraphQLObjectType({
            name:"query",
            description:"first GraphQL",
            fields:{
                hi:{
                    type:GraphQLString,
                    resolve:()=>{
                        return "Hi GraghQL"
                    }
                }
            }
        })
    })

    app.use("/graghql",createHandler({schema}))


    // app.get("/upload/*path",async (req:Request, res:Response, next:NextFunction) => {
    //     const {path} = req.params as {path:string[]}
    //     const Key = path.join("/") as string
    //     const result = await new S3Service().getFile(Key)
    //     console.log({result});
        
    //     // const result = await new S3Service().getFile({
    //     //     key:path
    //     // })
    //     return res.status(200).json({message:"success" , result})
    // })

        app.get("/deleteFile", async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const {Key} = req.query as {Key:string}
        console.log({Key})

        
        let result = await new S3Service().deleteFile(Key)
  
        return res.status(200).json({ message: "success", data: result}) 
    } catch (error) {
        next(error)
    }
})
        app.get("/deleteFiles", async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const {Keys} = req.body as {Keys:string[]}
        console.log({Keys})

        
        let result = await new S3Service().deleteFiles(Keys)
  
        return res.status(200).json({ message: "success", data: result}) 
    } catch (error) {
        next(error)
    }
})
        app.get("/deleteFolder", async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const {folderName} = req.body as {folderName:string}
        console.log({folderName})

        
        let result = await new S3Service().deleteFolder(folderName)
  
        return res.status(200).json({ message: "success", data: result}) 
    } catch (error) {
        next(error)
    }
})
        app.get("/getFiles", async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const {folderName} = req.query as {folderName:string}
        console.log({folderName})

        
        let result = await new S3Service().getFiles(folderName)
        let resultMapped = result.Contents?.map((file)=>{
            return {key:file.Key}

        })
        return res.status(200).json({ message: "success", data: resultMapped }) 
    } catch (error) {
        next(error)
    }
})
        app.get("/upload/pre-signed/*path", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { path } = req.params as { path: string[] }
        const {download} = req.query as {download:string}
        const Key = path.join("/") as string
        console.log({download});
        
        const url = await new S3Service().getPreSingleUrl({Key,download:download? download:undefined })
        return res.status(200).json({ message: "success", data: url }) 
    } catch (error) {
        next(error)
    }
})

    app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { path } = req.params as { path: string[] }
        const {download} = req.query
        const Key = path.join("/") as string
        
        const result = await new S3Service().getFile(Key)
        
        if (!result) {
            return res.status(404).json({ message: "File not found" })
        }
        const stream = result.Body as NodeJS.ReadableStream;
        res.setHeader("Content-Type",result.ContentType!)
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        if(download && download === "true"){
            res.setHeader("Content-Disposition", `attachment; filename="${path.pop()}"`); 
        }
       
        await pipeline(stream,res)
        
        // return res.status(200).json({ message: "success", data: result })
        
    } catch (error) {
        next(error)
    }
})


    app.use("{/*demo}", (req:Request, res:Response, next:NextFunction) => {
        throw new AppError("Route not found", 404);
    });
    app.use(globalErrorHandler);
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
};
export default bootstrap;
