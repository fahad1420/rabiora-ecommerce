import dns from "node:dns";
import mongoose from "mongoose";

// Only override DNS servers in local development when needed for Windows DNS SRV lookup issues.
// Never override DNS in Vercel / AWS Lambda environments as VPC firewalls block external UDP port 53.
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  } catch {
    // Ignore
  }
}

export function getMongoUri(): string {
  // 1. Check exact candidate names
  const candidates = [
    process.env.MONGODB_URI,
    process.env.DATABASE_URL,
    process.env.MONGO_URI,
    process.env.MONGODB_URL,
    process.env.MONGO_URL,
    process.env.MONGODB_CONNECTION_STRING,
    process.env.MONGO_CONNECTION_STRING,
    process.env.VITE_MONGODB_URI,
    process.env.NEXT_PUBLIC_MONGODB_URI,
  ];

  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }

  // 2. Dynamic search across process.env keys (handling potential trailing whitespace or uppercase/lowercase differences)
  for (const [key, val] of Object.entries(process.env)) {
    const cleanKey = key.trim().toUpperCase();
    if (
      (cleanKey.includes("MONGO") || cleanKey.includes("DATABASE_URL") || cleanKey.includes("DB_URI")) &&
      typeof val === "string" &&
      val.trim().length > 0
    ) {
      const trimmedVal = val.trim();
      if (trimmedVal.startsWith("mongodb://") || trimmedVal.startsWith("mongodb+srv://")) {
        return trimmedVal;
      }
    }
  }

  return "";
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
  const uri = getMongoUri();

  if (!uri) {
    throw new Error("[MongoDB] MONGODB_URI environment variable is not configured in environment.");
  }

  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 15000,
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
