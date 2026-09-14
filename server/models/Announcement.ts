import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncement extends Document {
  text: string;
  link?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    text: { type: String, required: true, trim: true },
    link: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true,
  }
);

export const AnnouncementModel: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

