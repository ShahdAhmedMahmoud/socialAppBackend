export class AppError extends Error {
    message;
    statusCode;
    constructor(message, statusCode = 500) {
        super();
        this.message = message;
        this.statusCode = statusCode;
        this.message = message;
        this.statusCode = statusCode;
    }
}
export const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: "error",
        message: err.message || "Internal Server Error",
        stack: err.stack
    });
};
