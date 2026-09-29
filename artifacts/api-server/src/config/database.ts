import mongoose from "mongoose";
import { logger } from "../lib/logger";

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn("MONGODB_URI is not set; RentalHub is using the development memory store");
    return false;
  }
  await mongoose.connect(uri);
  logger.info("Connected to MongoDB");
  return true;
}