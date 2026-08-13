import bcrypt from "bcryptjs";
import { parse } from "cookie";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import type { Request, Response } from "express";
import { users } from "../drizzle/schema";
import { getDb } from "./db";

const CUSTOMER_COOKIE = "rabiora_customer_session";
const encoder = new TextEncoder();
const sessionKey = () => encoder.encode(process.env.JWT_SECRET ?? "rabiora-development-session-key-change-in-production");

export type RabioraCustomer = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
};

export function normalizeBangladeshPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^8801[3-9]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^01[3-9]\d{8}$/.test(digits)) return `+88${digits}`;
  return null;
}

export function isValidCustomerPassword(value: string) {
  return value.length >= 8 && value.length <= 72;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

async function signCustomerSession(user: RabioraCustomer) {
  return new SignJWT({ type: "rabiora_customer", role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(sessionKey());
}

export async function setCustomerSession(res: Response, user: RabioraCustomer) {
  const token = await signCustomerSession(user);
  res.cookie(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearCustomerSession(res: Response) {
  res.clearCookie(CUSTOMER_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
}

export async function getCustomerFromRequest(req: Request): Promise<RabioraCustomer | null> {
  const token = parse(req.headers.cookie ?? "")[CUSTOMER_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey());
    if (payload.type !== "rabiora_customer" || !payload.sub) return null;
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const db = await getDb();
    if (!db) return null;
    const [user] = await db.select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
    }).from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function createCustomer({ name, phone, password }: { name: string; phone: string; password: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const passwordHash = await hashPassword(password);
  const normalizedPhone = normalizeBangladeshPhone(phone);
  if (!normalizedPhone) throw new Error("A valid Bangladesh phone number is required.");
  await db.insert(users).values({
    openId: `customer:${nanoid(24)}`,
    name,
    phone: normalizedPhone,
    passwordHash,
    loginMethod: "password",
    role: "user",
    lastSignedIn: new Date(),
  });
  const [customer] = await db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, phone: users.phone, role: users.role })
    .from(users).where(eq(users.phone, normalizedPhone)).limit(1);
  if (!customer) throw new Error("Customer account creation failed.");
  return customer;
}

export async function findCustomerByPhone(phone: string) {
  const normalizedPhone = normalizeBangladeshPhone(phone);
  if (!normalizedPhone) return null;
  const db = await getDb();
  if (!db) return null;
  const [customer] = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1);
  return customer ?? null;
}

export async function updateCustomerProfile(userId: number, { name, email }: { name: string; email?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ name, email: email || null }).where(eq(users.id, userId));
  const [customer] = await db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, phone: users.phone, role: users.role })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!customer) throw new Error("Customer profile update failed.");
  return customer;
}
