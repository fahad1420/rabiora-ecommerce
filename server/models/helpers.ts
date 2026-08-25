import mongoose, { Types } from "mongoose";

export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
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
    conditions.push({ _id: new mongoose.Types.ObjectId(idOrLegacy) });
  }
  if (conditions.length === 0) {
    conditions.push({ slug: String(idOrLegacy) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

export function findUserQuery(idOrOpenId: string | number): Record<string, any> {
  const conditions: any[] = [{ openId: String(idOrOpenId) }];
  if (typeof idOrOpenId === "string" && mongoose.isValidObjectId(idOrOpenId)) {
    conditions.push({ _id: new mongoose.Types.ObjectId(idOrOpenId) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

export function findOrderQuery(orderIdOrNumber: string | number): Record<string, any> {
  const conditions: any[] = [{ orderNumber: String(orderIdOrNumber) }];
  if (typeof orderIdOrNumber === "string" && mongoose.isValidObjectId(orderIdOrNumber)) {
    conditions.push({ _id: new mongoose.Types.ObjectId(orderIdOrNumber) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

