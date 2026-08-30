import mongoose, { Schema, type Document, type Types } from "mongoose";

import { Event } from "./event.model";

export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Booking eventId is required."],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Booking email is required."],
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Booking email must be a valid email address.",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Fast lookup for bookings tied to a single event.
bookingSchema.index({ eventId: 1 });

// Common query pattern: list bookings for an event by creation date, newest first.
bookingSchema.index({ eventId: 1, createdAt: -1 });

// Speed up user booking lookups by email.
bookingSchema.index({ email: 1 });

// Before saving, ensure the related event actually exists to prevent orphan bookings.
bookingSchema.pre("save", async function () {
  const eventExists = await Event.exists({ _id: this.eventId });

  if (!eventExists) {
    throw new Error(
      "Booking cannot be created because the referenced event does not exist.",
    );
  }
});

export const Booking =
  (mongoose.models.Booking as mongoose.Model<IBooking>) ||
  mongoose.model<IBooking>("Booking", bookingSchema);
