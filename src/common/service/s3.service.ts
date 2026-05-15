import {DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRET_ACCESS_KEY } from "../../config/config.service.js";
import { randomUUID } from "node:crypto";
import  { storage_enum } from "../enum/multer.enum.js";
import fs from "node:fs"
import { AppError } from "../utils/global-error-handler.js";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


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
            Key:`social_media_app_2/${path}/${randomUUID()}__${file.originalname}`,
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
            Key:`social_media_app_2/${path}/${randomUUID()}__${file.originalname}`,
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

    async createPreSingleUrl({
        path,
        fileName,
        ContentType,
        expiresIn=3600
       
    }:{
        path:string
        fileName:string,
        ContentType?:string,
        expiresIn?:number
        
    }){
        const Key =`social_media_app_2/${path}/${randomUUID()}__${fileName}`
        const command = new PutObjectCommand({
            Bucket:AWS_BUCKET_NAME,
            Key,
            ContentType
        })
        const url = await getSignedUrl(this.client,command,{expiresIn})
        return {url , Key}
    }
    async getFile(Key:string){
        const command = new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key
        })
        return await this.client.send(command)

    }

    
    async getPreSingleUrl({
        Key,
        expiresIn=3600 ,
        download
    }:{
        Key:string,
        expiresIn?:number ,
        download?:string|undefined
    }){ 
        console.log(download,'download')
        const command = new GetObjectCommand({
            Bucket:AWS_BUCKET_NAME,
            Key,
            ResponseContentDisposition:download? `attachment; filename="${Key.split("/").pop()}"` : undefined  
        })
        const url = await getSignedUrl(this.client,command,{expiresIn})
        return url
    }

     async getFiles(folderName:string){
        const command = new ListObjectsV2Command({
            Bucket: AWS_BUCKET_NAME,
            Prefix : `social_media_app_2/${folderName}`
        })
        return await this.client.send(command)

    }
     async deleteFile(Key:string){
        const command = new DeleteObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key 
        })
        return await this.client.send(command)

    }
     async deleteFiles(Keys:string[]){
        const KeyMapped = Keys.map((k)=>{
            return {Key:k}
        })


        const command = new DeleteObjectsCommand({
            Bucket: AWS_BUCKET_NAME,
            Delete:{
                Objects:KeyMapped,
                Quiet: false
            },

        })
        return await this.client.send(command)

    }
     async deleteFolder(folderName:string){
       const data = await this.getFiles(folderName)
       const KeyMapped = data?.Contents?.map((k)=>{
            return k.Key
        })
        return await this.deleteFiles(KeyMapped as string[])
    }



}