import {ObjectCannedACL, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../../config/config.service.js";
import { randomUUID } from "node:crypto";
import  { storage_enum } from "../enum/multer.enum.js";
import fs from "node:fs"
import { AppError } from "../utils/global-error-handler.js";
import { Upload } from "@aws-sdk/lib-storage";

export class S3Service {

    private client:S3Client

    constructor(){
        this.client = new S3Client({
            region:AWS_REGION,
            credentials :{
                accessKeyId:AWS_ACCESS_KEY,
                secretAccessKey:AWS_SECRET_ACCESS_KEY
            }
        })
    }

    async uploadFile({
        file,
        storage_type = storage_enum.memory,
        path="General",
        ACL = ObjectCannedACL.private
    }:{
        file:Express.Multer.File,
        storage_type?:storage_enum ,
        path?:string
        ACL?: ObjectCannedACL
    }){
        const command = new PutObjectCommand({
            Bucket:AWS_BUCKET_NAME,
            ACL,
            Key:`social_media_app_2/${path}/${randomUUID}__${file.originalname}`,
            Body:storage_type  === storage_enum.memory? file.buffer : fs.createReadStream(file.path),
            ContentType:file.mimetype
        })
        console.log("command",command)

        if(!command.input.Key){
            throw new AppError("fail to upload file")
        }

        await this.client.send(command)
        return command.input.Key
    }


    async uploadLargeFile({
        file,
        storage_type = storage_enum.disk,
        path="General",
        ACL = ObjectCannedACL.private
    }:{
        file:Express.Multer.File,
        storage_type?:storage_enum ,
        path?:string
        ACL?: ObjectCannedACL
    }){
        const command = new Upload({
            client:this.client,
            params:{
            Bucket:AWS_BUCKET_NAME,
            ACL,
            Key:`social_media_app_2/${path}/${randomUUID}__${file.originalname}`,
            Body:storage_type  === storage_enum.memory? file.buffer : fs.createReadStream(file.path),
            ContentType:file.mimetype
            }
 
        })


       const result =  await command.done()
         command.on("httpUploadProgress", (progress) => {
    console.log(progress);
  });
        return result.Key as string
    }

    async uploadFiles({
        files,
        storage_type = storage_enum.memory,
        path="General",
        ACL = ObjectCannedACL.private,
        isLarge=false
    }:{
        files:Express.Multer.File[],
        storage_type?:storage_enum ,
        path?:string
        ACL?: ObjectCannedACL,
        isLarge?:boolean
    }
    ){
        let urls:string[] = []
        if(isLarge){
            urls =await Promise.all(files.map((file)=>{
            return this.uploadLargeFile({file,storage_type,path,ACL})
        }))
        }else{
            urls =await Promise.all(files.map((file)=>{
            return this.uploadFile({file,storage_type,path,ACL})
        }))
        }
        return urls
    }
}