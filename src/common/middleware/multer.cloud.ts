import multer from "multer"
import { storage_enum } from "../enum/multer.enum.js"
import { tmpdir } from "node:os"
import type { Request } from "express"
import { multer_enum } from '../enum/multer.enum.js';



const multerCloud = (
    {storage_type = storage_enum.memory ,
    custom_types=multer_enum.image,
    maxFileSize = 5*1024*1024
 }:
    {storage_type?:storage_enum ,
    custom_types?: string[],
    maxFileSize?:number
} = {}) => {
    const storage = storage_type===storage_enum.memory?  multer.memoryStorage() :multer.diskStorage({
        destination:tmpdir(),
     filename: function (req:Request, file:Express.Multer.File, cb:Function) {
      console.log(file, "before");

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
    },

    })
      function fileFilter(req:Request, file:Express.Multer.File, cb:Function) {
    if (custom_types.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log(file);
      cb(new Error("invalid file type"), false);
    }
  }


    const upload = multer({storage,fileFilter,limits:{fileSize:maxFileSize}})
    return upload
   

}

export default multerCloud