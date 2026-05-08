export const multer_enum = {
    image: ["image/jpeg", "image/png", "image/jpg", "image/jfif", "image/webp"],
    video: ["video/mp4", "video/mpeg", "video/quicktime"],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
    pdf: ["application/pdf"],
};
export var storage_enum;
(function (storage_enum) {
    storage_enum["disk"] = "disk";
    storage_enum["memory"] = "memory";
})(storage_enum || (storage_enum = {}));
