
import type { NextFunction , Response, Request } from "express";
import type { ZodType } from "zod";

import { AppError } from "../utils/global-error-handler.js";

type reqType = keyof Request;
type schemaType = Partial<Record<reqType, ZodType>>;

export const validation = (schema: schemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validationError = [];
        for (const key of Object.keys(schema) as reqType[]) {
            if(!schema[key]) continue;
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validationError.push(result.error.message);
            }
        }
        if (validationError.length > 0) {
            throw new AppError(JSON.parse(validationError as unknown as string));
        }
        next();
    };
}