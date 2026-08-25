import mongoose, { Types } from "mongoose";

export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  if (typeof id !== "string") return id;
  return Types.ObjectId.isValid(id)
    ? Types.ObjectId.createFromHexString(id)
    : new Types.ObjectId(id);
}

export function isValidObjectId(id: unknown): boolean {
  return typeof id === "string" && mongoose.isValidObjectId(id);
}

export function findProductQuery(idOrLegacy: string | number): Record<string, any> {
  const conditions: any[] = [];
  const num = typeof idOrLegacy === "number" ? idOrLegacy : Number(idOrLegacy);
  if (!isNaN(num) && num > 0) {
    conditions.push({ legacyId: num });
  }
  if (typeof idOrLegacy === "string" && mongoose.isValidObjectId(idOrLegacy)) {
    conditions.push({ _id: Types.ObjectId.createFromHexString(idOrLegacy) });
  }
  if (conditions.length === 0) {
    conditions.push({ slug: String(idOrLegacy) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

export function findUserQuery(idOrOpenId: string | number): Record<string, any> {
  const conditions: any[] = [{ openId: String(idOrOpenId) }];
  if (typeof idOrOpenId === "string" && mongoose.isValidObjectId(idOrOpenId)) {
    conditions.push({ _id: Types.ObjectId.createFromHexString(idOrOpenId) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

export function findOrderQuery(orderIdOrNumber: string | number): Record<string, any> {
  const conditions: any[] = [{ orderNumber: String(orderIdOrNumber) }];
  if (typeof orderIdOrNumber === "string" && mongoose.isValidObjectId(orderIdOrNumber)) {
    conditions.push({ _id: Types.ObjectId.createFromHexString(orderIdOrNumber) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}
