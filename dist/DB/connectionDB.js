import mongoose from "mongoose";
import { MONGO_URI } from "../config/config.service.js";
export const checkConnectionDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`Connected to MongoDB at ${MONGO_URI}`);
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};
