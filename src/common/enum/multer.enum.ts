

export const multer_enum = {
  image: ["image/jpeg", "image/png", "image/jpg", "image/jfif", "image/webp"],
  video: ["video/mp4", "video/mpeg", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
  pdf: ["application/pdf"],
};

export enum storage_enum  {
    disk ="disk",
    memory = "memory"
}