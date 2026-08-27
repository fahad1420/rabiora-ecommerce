import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { CouponModel } from "./models/Coupon";

export const ONLINE_PAYMENT_METHODS = ["bKash", "Nagad", "Rocket"] as const;

export function isOnlinePayment(method: string): boolean {
  const normalized = method.trim().toLowerCase();
  return normalized === "bkash" || normalized === "nagad" || normalized === "rocket";
}

export function normalizePaymentMethodName(method: string): string {
  const normalized = method.trim().toLowerCase();
  if (normalized === "bkash") return "bKash";
  if (normalized === "nagad") return "Nagad";
  if (normalized === "rocket") return "Rocket";
  if (normalized === "cash on delivery" || normalized === "cod") return "Cash on Delivery";
  return method.trim();
}

async function ensureDefaultCoupons() {
  const count = await CouponModel.countDocuments();
  if (count === 0) {
    await CouponModel.create([
      {
        code: "RABIORA10",
        discountType: "percentage",
        discountValue: 10,
        isActive: true,
        allowedPaymentMethods: ["bKash", "Nagad", "Rocket"],
        minOrderAmount: 0,
      },
      {
        code: "BKASH10",
        discountType: "percentage",
        discountValue: 10,
        isActive: true,
        allowedPaymentMethods: ["bKash", "Nagad", "Rocket"],
        minOrderAmount: 0,
      },
    ]);
  }
}

export async function validateCoupon(
  code: string,
  subtotalTaka: number,
  paymentMethod: string
) {
  await connectMongo();
  await ensureDefaultCoupons();

  const normalizedCode = (code || "").trim().toUpperCase();
  if (!normalizedCode) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Please enter a coupon code." });
  }

  // 1. Online payment only check
  if (!isOnlinePayment(paymentMethod)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Coupons are available exclusively for online payment methods (bKash, Nagad, Rocket).",
    });
  }

  // 2. Find active coupon in MongoDB
  const coupon = await CouponModel.findOne({ code: normalizedCode }).lean();
  if (!coupon) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid coupon code." });
  }

  if (!coupon.isActive) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This coupon is currently inactive." });
  }

  // 3. Expiry date check
  if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This coupon code has expired." });
  }

  // 4. Minimum order amount check
  if (coupon.minOrderAmount && subtotalTaka < coupon.minOrderAmount) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Minimum order amount of ৳${coupon.minOrderAmount.toLocaleString("en-BD")} required to use this coupon.`,
    });
  }

  // 5. Usage limit check
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This coupon has reached its maximum redemption limit.",
    });
  }

  // 6. Payment method eligibility
  const normalizedMethod = normalizePaymentMethodName(paymentMethod);
  const allowed = coupon.allowedPaymentMethods || ["bKash", "Nagad", "Rocket"];
  const isMethodAllowed = allowed.some(
    (m) => m.toLowerCase() === normalizedMethod.toLowerCase()
  );

  if (!isMethodAllowed) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `This coupon is only valid for: ${allowed.join(", ")}.`,
    });
  }

  // 7. Calculate discount
  const discountPercent = coupon.discountValue;
  const discountAmount = Math.min(
    subtotalTaka,
    Math.round((subtotalTaka * discountPercent) / 100)
  );
  const payableSubtotal = Math.max(0, subtotalTaka - discountAmount);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountPercent,
    discountAmount,
    payableSubtotal,
    message: `${discountPercent}% discount applied successfully!`,
  };
}

export async function incrementCouponUsage(code: string) {
  await connectMongo();
  const normalizedCode = (code || "").trim().toUpperCase();
  if (!normalizedCode) return;
  await CouponModel.updateOne(
    { code: normalizedCode },
    { $inc: { usedCount: 1 } }
  );
}

export async function listAdminCoupons() {
  await connectMongo();
  await ensureDefaultCoupons();
  const coupons = await CouponModel.find().sort({ createdAt: -1 }).lean();
  return coupons.map((c) => ({
    id: c._id.toString(),
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    isActive: c.isActive,
    expiryDate: c.expiryDate,
    minOrderAmount: c.minOrderAmount || 0,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount || 0,
    allowedPaymentMethods: c.allowedPaymentMethods || ["bKash", "Nagad", "Rocket"],
    createdAt: c.createdAt,
  }));
}

export async function createAdminCoupon(input: {
  code: string;
  discountType?: "percentage";
  discountValue: number;
  isActive?: boolean;
  expiryDate?: Date | string | null;
  minOrderAmount?: number;
  usageLimit?: number | null;
  allowedPaymentMethods?: string[];
}) {
  await connectMongo();
  const normalizedCode = input.code.trim().toUpperCase();
  if (!normalizedCode) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Coupon code is required." });
  }

  const existing = await CouponModel.findOne({ code: normalizedCode });
  if (existing) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Coupon with code "${normalizedCode}" already exists.` });
  }

  if (input.discountValue < 1 || input.discountValue > 100) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Discount percentage must be between 1 and 100." });
  }

  const created = await CouponModel.create({
    code: normalizedCode,
    discountType: input.discountType || "percentage",
    discountValue: input.discountValue,
    isActive: input.isActive ?? true,
    expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
    minOrderAmount: input.minOrderAmount ?? 0,
    usageLimit: input.usageLimit ?? null,
    allowedPaymentMethods: input.allowedPaymentMethods && input.allowedPaymentMethods.length > 0
      ? input.allowedPaymentMethods
      : ["bKash", "Nagad", "Rocket"],
  });

  return {
    id: created._id.toString(),
    code: created.code,
    discountValue: created.discountValue,
    isActive: created.isActive,
  };
}

export async function updateAdminCoupon(
  id: string,
  input: {
    code?: string;
    discountType?: "percentage";
    discountValue?: number;
    isActive?: boolean;
    expiryDate?: Date | string | null;
    minOrderAmount?: number;
    usageLimit?: number | null;
    allowedPaymentMethods?: string[];
  }
) {
  await connectMongo();
  const normalizedCode = input.code ? input.code.trim().toUpperCase() : undefined;

  if (normalizedCode) {
    const existing = await CouponModel.findOne({ code: normalizedCode, _id: { $ne: id } });
    if (existing) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Another coupon with code "${normalizedCode}" already exists.` });
    }
  }

  if (input.discountValue !== undefined && (input.discountValue < 1 || input.discountValue > 100)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Discount percentage must be between 1 and 100." });
  }

  const updated = await CouponModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(normalizedCode !== undefined && { code: normalizedCode }),
        ...(input.discountType !== undefined && { discountType: input.discountType }),
        ...(input.discountValue !== undefined && { discountValue: input.discountValue }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.expiryDate !== undefined && { expiryDate: input.expiryDate ? new Date(input.expiryDate) : null }),
        ...(input.minOrderAmount !== undefined && { minOrderAmount: input.minOrderAmount }),
        ...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
        ...(input.allowedPaymentMethods !== undefined && { allowedPaymentMethods: input.allowedPaymentMethods }),
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Coupon not found." });
  }

  return {
    id: updated._id.toString(),
    code: updated.code,
    discountValue: updated.discountValue,
    isActive: updated.isActive,
  };
}

export async function deleteAdminCoupon(id: string) {
  await connectMongo();
  await CouponModel.findByIdAndDelete(id);
  return { success: true };
}
