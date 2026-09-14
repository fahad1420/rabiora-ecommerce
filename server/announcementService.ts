import { connectMongo } from "./config/db";
import { AnnouncementModel } from "./models";

const DEFAULT_ANNOUNCEMENTS = [
  {
    text: "Free Delivery Inside Dhaka",
    link: "",
    isActive: true,
    displayOrder: 1,
  },
  {
    text: "Premium Pakistani Three Piece Collection",
    link: "/#products",
    isActive: true,
    displayOrder: 2,
  },
  {
    text: "Cash On Delivery Available",
    link: "",
    isActive: true,
    displayOrder: 3,
  },
];

async function seedDefaultAnnouncementsIfEmpty() {
  const count = await AnnouncementModel.countDocuments();
  if (count === 0) {
    await AnnouncementModel.insertMany(DEFAULT_ANNOUNCEMENTS);
  }
}

export async function listActiveAnnouncements() {
  await connectMongo();
  await seedDefaultAnnouncementsIfEmpty();
  
  const docs = await AnnouncementModel.find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  return docs.map((d) => ({
    id: d._id.toString(),
    text: d.text,
    link: d.link || "",
    isActive: d.isActive,
    displayOrder: d.displayOrder ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export async function listAllAnnouncements() {
  await connectMongo();
  await seedDefaultAnnouncementsIfEmpty();

  const docs = await AnnouncementModel.find({})
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  return docs.map((d) => ({
    id: d._id.toString(),
    text: d.text,
    link: d.link || "",
    isActive: d.isActive,
    displayOrder: d.displayOrder ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export async function createAnnouncement(input: {
  text: string;
  link?: string;
  isActive?: boolean;
  displayOrder?: number;
}) {
  await connectMongo();
  const doc = await AnnouncementModel.create({
    text: input.text.trim(),
    link: input.link ? input.link.trim() : "",
    isActive: input.isActive ?? true,
    displayOrder: input.displayOrder ?? 0,
  });

  return {
    id: doc._id.toString(),
    text: doc.text,
    link: doc.link,
    isActive: doc.isActive,
    displayOrder: doc.displayOrder,
  };
}

export async function updateAnnouncement(
  id: string,
  input: {
    text?: string;
    link?: string;
    isActive?: boolean;
    displayOrder?: number;
  }
) {
  await connectMongo();
  const updateData: Record<string, any> = {};
  if (input.text !== undefined) updateData.text = input.text.trim();
  if (input.link !== undefined) updateData.link = input.link.trim();
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

  const doc = await AnnouncementModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).lean();

  if (!doc) {
    throw new Error("Announcement not found.");
  }

  return {
    id: doc._id.toString(),
    text: doc.text,
    link: doc.link,
    isActive: doc.isActive,
    displayOrder: doc.displayOrder,
  };
}

export async function deleteAnnouncement(id: string) {
  await connectMongo();
  const res = await AnnouncementModel.findByIdAndDelete(id);
  if (!res) {
    throw new Error("Announcement not found.");
  }
  return { success: true };
}

