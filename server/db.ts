import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);

      const pool = mysql.createPool({
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
        ssl: {
          minVersion: "TLSv1.2",
        },
        waitForConnections: true,
        connectionLimit: 10,
      });

      const db = drizzle({ client: pool });

      _db = db as unknown as ReturnType<typeof drizzle>;
    } catch (error) {
      console.error("[Database] Failed to initialize:", error);
      _db = null;
    }
  }

  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();

  if (!db) {
    console.warn(
      "[Database] Cannot upsert user: database not available",
    );
    return;
  }

  const values: InsertUser = {
    openId: user.openId,
  };

  const updateSet: Record<string, unknown> = {};

  const textFields = [
    "name",
    "email",
    "phone",
    "loginMethod",
    "passwordHash",
  ] as const;

  for (const field of textFields) {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  const role =
    user.role ??
    (user.openId === ENV.ownerOpenId ? "admin" : "user");

  values.role = role;
  updateSet.role = role;

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
  }

  if (Object.keys(updateSet).length === 0) {
    updateSet.lastSignedIn = new Date();
  }

  try {
    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
        set: updateSet,
      });
  } catch (error) {
    console.error(
      "[Database] Failed to upsert user:",
      error,
    );
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();

  if (!db) {
    console.warn(
      "[Database] Cannot get user: database not available",
    );
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0];
}