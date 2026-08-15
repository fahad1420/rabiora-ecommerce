import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { parse } from "cookie";
import { and, eq, gt, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import type { Request, Response } from "express";
import {
  users,
  passwordResetTokens,
} from "../drizzle/schema";
import { getDb } from "./db";

const CUSTOMER_COOKIE = "rabiora_customer_session";
const ORDER_CONFIRMATION_COOKIE = "rabiora_order_confirmation";

const encoder = new TextEncoder();

const sessionKey = () =>
  encoder.encode(
    process.env.JWT_SECRET ??
      "rabiora-development-session-key-change-in-production",
  );

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

  if (/^8801[3-9]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^01[3-9]\d{8}$/.test(digits)) {
    return `+88${digits}`;
  }

  return null;
}

export function isValidCustomerPassword(value: string) {
  return value.length >= 8 && value.length <= 72;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  return bcrypt.compare(password, passwordHash);
}

async function signCustomerSession(user: RabioraCustomer) {
  return new SignJWT({
    type: "rabiora_customer",
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(sessionKey());
}

export async function setCustomerSession(
  res: Response,
  user: RabioraCustomer,
) {
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
  res.clearCookie(CUSTOMER_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

async function signOrderConfirmation(orderNumber: string) {
  return new SignJWT({
    type: "rabiora_order_confirmation",
    orderNumber,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("6h")
    .sign(sessionKey());
}

export async function setGuestOrderConfirmation(
  res: Response,
  orderNumber: string,
) {
  const token = await signOrderConfirmation(orderNumber);

  res.cookie(ORDER_CONFIRMATION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 6 * 60 * 60 * 1000,
    path: "/",
  });
}

export async function hasGuestOrderConfirmationAccess(
  req: Request,
  orderNumber: string,
) {
  const token =
    parse(req.headers.cookie ?? "")[ORDER_CONFIRMATION_COOKIE];

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, sessionKey());

    return (
      payload.type === "rabiora_order_confirmation" &&
      payload.orderNumber === orderNumber
    );
  } catch {
    return false;
  }
}

export async function getCustomerFromRequest(
  req: Request,
): Promise<RabioraCustomer | null> {
  const token =
    parse(req.headers.cookie ?? "")[CUSTOMER_COOKIE];

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionKey());

    if (
      payload.type !== "rabiora_customer" ||
      !payload.sub
    ) {
      return null;
    }

    const id = Number(payload.sub);

    if (!Number.isInteger(id)) return null;

    const db = await getDb();

    if (!db) return null;

    const [user] = await db
      .select({
        id: users.id,
        openId: users.openId,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  } catch {
    return null;
  }
}

export async function createCustomer({
  name,
  phone,
  password,
}: {
  name: string;
  phone: string;
  password: string;
}) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database unavailable");
  }

  const passwordHash = await hashPassword(password);

  const normalizedPhone = normalizeBangladeshPhone(phone);

  if (!normalizedPhone) {
    throw new Error(
      "A valid Bangladesh phone number is required.",
    );
  }

  await db.insert(users).values({
    openId: `customer:${nanoid(24)}`,
    name,
    phone: normalizedPhone,
    passwordHash,
    loginMethod: "password",
    role: "user",
    lastSignedIn: new Date(),
  });

  const [customer] = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
    })
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  if (!customer) {
    throw new Error("Customer account creation failed.");
  }

  return customer;
}

export async function findCustomerByPhone(phone: string) {
  const normalizedPhone = normalizeBangladeshPhone(phone);

  if (!normalizedPhone) return null;

  const db = await getDb();

  if (!db) return null;

  const [customer] = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  return customer ?? null;
}

export async function updateCustomerProfile(
  userId: number,
  {
    name,
    email,
  }: {
    name: string;
    email?: string;
  },
) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database unavailable");
  }

  await db
    .update(users)
    .set({
      name,
      email: email || null,
    })
    .where(eq(users.id, userId));

  const [customer] = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!customer) {
    throw new Error("Customer profile update failed.");
  }

  return customer;
}

/* =========================================================
   PASSWORD RESET
   ========================================================= */

export async function createPasswordResetRequest(
  phone: string,
) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database unavailable");
  }

  const normalizedPhone = normalizeBangladeshPhone(phone);

  // Do not reveal whether an account exists.
  if (!normalizedPhone) {
    return {
      success: true as const,
    };
  }

  const [user] = await db
    .select({
      id: users.id,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  if (!user) {
    return {
      success: true as const,
    };
  }

  const otpCode = String(
    crypto.randomInt(100000, 1000000),
  );

  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000,
  );

  // Invalidate previous unused reset requests.
  await db
    .update(passwordResetTokens)
    .set({
      usedAt: new Date(),
    })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    otpCode,
    purpose: "password_reset",
    expiresAt,
  });

  /*
   * Development helper:
   * Until an SMS provider is connected, the OTP is returned
   * only outside production so we can test the complete flow.
   */
  if (process.env.NODE_ENV !== "production") {
    return {
      success: true as const,
      devOtp: otpCode,
      devToken: rawToken,
    };
  }

  return {
    success: true as const,
  };
}

export async function resetCustomerPassword({
  phone,
  otpCode,
  newPassword,
}: {
  phone: string;
  otpCode: string;
  newPassword: string;
}) {
  const db = await getDb();

  if (!db) {
    throw new Error("Database unavailable");
  }

  const normalizedPhone =
    normalizeBangladeshPhone(phone);

  if (!normalizedPhone) {
    throw new Error("Invalid phone number.");
  }

  if (!/^\d{6}$/.test(otpCode)) {
    throw new Error("Invalid or expired reset code.");
  }

  if (!isValidCustomerPassword(newPassword)) {
    throw new Error(
      "Password must contain 8–72 characters.",
    );
  }

  const [user] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  if (!user) {
    throw new Error(
      "Invalid or expired reset code.",
    );
  }

  const now = new Date();

  const [reset] = await db
    .select({
      id: passwordResetTokens.id,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.otpCode, otpCode),
        eq(
          passwordResetTokens.purpose,
          "password_reset",
        ),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!reset) {
    throw new Error(
      "Invalid or expired reset code.",
    );
  }

  const passwordHash =
    await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        loginMethod: "password",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await tx
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(
        eq(passwordResetTokens.id, reset.id),
      );
  });

  return {
    success: true as const,
  };
}