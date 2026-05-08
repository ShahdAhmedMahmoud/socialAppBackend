import multer from "multer";
import { storage_enum } from "../enum/multer.enum.js";
import { tmpdir } from "node:os";
import { multer_enum } from '../enum/multer.enum.js';
const multerCloud = ({ storage_type = storage_enum.memory, custom_types = multer_enum.image, maxFileSize = 5 * 1024 * 1024 } = {}) => {
    const storage = storage_type === storage_enum.memory ? multer.memoryStorage() : multer.diskStorage({
        destination: tmpdir(),
        filename: function (req, file, cb) {
            console.log(file, "before");
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
        },
    });
    function fileFilter(req, file, cb) {
        if (custom_types.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            console.log(file);
            cb(new Error("invalid file type"), false);
        }
    }
    const upload = multer({ storage, fileFilter, limits: { fileSize: maxFileSize } });
    return upload;
};
export default multerCloud;
