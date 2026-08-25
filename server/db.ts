import { connectMongo } from "./config/db";
import { UserModel, IUser } from "./models/User";
import { ENV } from "./_core/env";

export { connectMongo, connectMongo as getDb };

export async function upsertUser(user: Partial<IUser> & { openId: string }): Promise<IUser | null> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  await connectMongo();

  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");

  const updateData: Record<string, unknown> = {
    role,
    lastSignedIn: user.lastSignedIn || new Date(),
  };

  if (user.name !== undefined) updateData.name = user.name;
  if (user.email !== undefined) updateData.email = user.email;
  if (user.phone !== undefined) updateData.phone = user.phone;
  if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
  if (user.passwordHash !== undefined) updateData.passwordHash = user.passwordHash;

  const doc = await UserModel.findOneAndUpdate(
    { openId: user.openId },
    {
      $set: updateData,
      $setOnInsert: {
        openId: user.openId,
      },
    },
    { new: true, upsert: true }
  );

  return doc;
}

export async function getUserByOpenId(openId: string): Promise<IUser | null> {
  await connectMongo();
  return UserModel.findOne({ openId });
}