import dns from "node:dns";
import mongoose from "mongoose";

// Set resilient DNS servers for MongoDB Atlas SRV lookups on environments with local DNS issues
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Ignore if running in environment where setServers is restricted
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || "";

  if (!uri) {
    console.warn("[MongoDB] MONGODB_URI not defined. Database operations may fail.");
    return mongoose;
  }

  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("[MongoDB] Successfully connected to database");
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("[MongoDB] Connection error:", e);
    throw e;
  }

  return cached!.conn;
}

export default connectMongo;
