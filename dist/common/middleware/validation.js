import { AppError } from "../utils/global-error-handler.js";
export const validation = (schema) => {
    return (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validationError.push(result.error.message);
            }
        }
        if (validationError.length > 0) {
            throw new AppError(JSON.parse(validationError));
        }
        next();
    };
};
