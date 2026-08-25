import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { parse } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import type { Request, Response } from "express";
import { connectMongo } from "./config/db";
import { UserModel, PasswordResetTokenModel, findUserQuery } from "./models";

const CUSTOMER_COOKIE = "rabiora_customer_session";
const ORDER_CONFIRMATION_COOKIE = "rabiora_order_confirmation";

const encoder = new TextEncoder();

const sessionKey = () =>
  encoder.encode(
    process.env.JWT_SECRET ??
      "rabiora-development-session-key-change-in-production"
  );

export type RabioraCustomer = {
  id: string | number;
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
  passwordHash: string
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

export function getSessionCookieOptions(req?: Request) {
  const isProduction = process.env.NODE_ENV === "production";
  const origin = req?.get("origin");
  const host = req?.get("host");
  const isSecure = req?.secure || req?.headers["x-forwarded-proto"] === "https" || isProduction;
  const isCrossSite = Boolean(origin && host && !origin.includes(host));

  if (isProduction || (isSecure && isCrossSite)) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
    };
  }

  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function setCustomerSession(
  res: Response,
  user: RabioraCustomer,
  req?: Request
) {
  const token = await signCustomerSession(user);
  const cookieOptions = getSessionCookieOptions(req);

  res.cookie(CUSTOMER_COOKIE, token, {
    ...cookieOptions,
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
}

export function clearCustomerSession(res: Response, req?: Request) {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(CUSTOMER_COOKIE, {
    ...cookieOptions,
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
  req?: Request
) {
  const token = await signOrderConfirmation(orderNumber);
  const cookieOptions = getSessionCookieOptions(req);

  res.cookie(ORDER_CONFIRMATION_COOKIE, token, {
    ...cookieOptions,
    maxAge: 6 * 60 * 60 * 1000,
  });
}

export async function hasGuestOrderConfirmationAccess(
  req: Request,
  orderNumber: string
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
  req: Request
): Promise<RabioraCustomer | null> {
  let token =
    parse(req.headers.cookie ?? "")[CUSTOMER_COOKIE];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionKey());

    if (
      payload.type !== "rabiora_customer" ||
      !payload.sub
    ) {
      return null;
    }

    await connectMongo();

    const user = await UserModel.findOne(findUserQuery(payload.sub)).lean();

    if (!user) return null;

    return {
      id: user._id.toString(),
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      role: user.role,
    };
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
  await connectMongo();

  const passwordHash = await hashPassword(password);
  const normalizedPhone = normalizeBangladeshPhone(phone);

  if (!normalizedPhone) {
    throw new Error("A valid Bangladesh phone number is required.");
  }

  const existing = await UserModel.findOne({ phone: normalizedPhone });
  if (existing) {
    throw new Error("An account with this phone number already exists.");
  }

  const user = await UserModel.create({
    openId: `customer:${nanoid(24)}`,
    name,
    phone: normalizedPhone,
    passwordHash,
    loginMethod: "password",
    role: "user",
    lastSignedIn: new Date(),
  });

  return {
    id: user._id.toString(),
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    phone: user.phone ?? null,
    role: user.role,
  };
}

export async function findCustomerByPhone(phone: string) {
  const normalizedPhone = normalizeBangladeshPhone(phone);
  if (!normalizedPhone) return null;

  await connectMongo();
  const customer = await UserModel.findOne({ phone: normalizedPhone }).lean();
  return customer ?? null;
}

export async function updateCustomerProfile(
  userId: string | number,
  {
    name,
    email,
  }: {
    name: string;
    email?: string;
  }
) {
  await connectMongo();

  const customer = await UserModel.findOneAndUpdate(
    findUserQuery(userId),
    {
      $set: {
        name,
        email: email || undefined,
      },
    },
    { new: true }
  ).lean();

  if (!customer) {
    throw new Error("Customer profile update failed.");
  }

  return {
    id: customer._id.toString(),
    openId: customer.openId,
    name: customer.name ?? null,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    role: customer.role,
  };
}

export async function createPasswordResetRequest(phone: string) {
  await connectMongo();

  const normalizedPhone = normalizeBangladeshPhone(phone);

  if (!normalizedPhone) {
    return { success: true as const };
  }

  const user = await UserModel.findOne({ phone: normalizedPhone });

  if (!user) {
    return { success: true as const };
  }

  const otpCode = String(crypto.randomInt(100000, 1000000));
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await PasswordResetTokenModel.updateMany(
    { userId: user._id, usedAt: { $exists: false } },
    { $set: { usedAt: new Date() } }
  );

  await PasswordResetTokenModel.create({
    userId: user._id,
    tokenHash,
    otpCode,
    purpose: "password_reset",
    expiresAt,
  });

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
  await connectMongo();

  const normalizedPhone = normalizeBangladeshPhone(phone);

  if (!normalizedPhone) {
    throw new Error("Invalid phone number.");
  }

  if (!/^\d{6}$/.test(otpCode)) {
    throw new Error("Invalid or expired reset code.");
  }

  if (!isValidCustomerPassword(newPassword)) {
    throw new Error("Password must contain 8–72 characters.");
  }

  const user = await UserModel.findOne({ phone: normalizedPhone });

  if (!user) {
    throw new Error("Invalid or expired reset code.");
  }

  const reset = await PasswordResetTokenModel.findOne({
    userId: user._id,
    otpCode,
    purpose: "password_reset",
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!reset) {
    throw new Error("Invalid or expired reset code.");
  }

  const passwordHash = await hashPassword(newPassword);

  user.passwordHash = passwordHash;
  user.loginMethod = "password";
  await user.save();

  reset.usedAt = new Date();
  await reset.save();

  return {
    success: true as const,
  };
}