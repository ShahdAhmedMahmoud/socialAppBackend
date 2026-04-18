import type { Request,Response,NextFunction } from "express";
export class AppError extends Error {
    constructor(public message:any,public statusCode:number=500) {
        super();
        this.message = message;
        this.statusCode = statusCode;
    }
}

export const globalErrorHandler = (err:AppError, req:Request, res:Response, next:NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: "error",
        message: err.message || "Internal Server Error",
        stack:err.stack
    });
}