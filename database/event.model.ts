import mongoose, { Schema, type Document } from "mongoose";

export type EventMode = "online" | "offline" | "hybrid";

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: EventMode;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeDate = (value: string): string => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Event date must be a valid ISO or date string.");
  }

  return parsedDate.toISOString().slice(0, 10);
};

const normalizeTime = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Event time is required.");
  }

  const match = trimmed.match(/^([0-9]{1,2}):([0-9]{2})(\s*(AM|PM))?$/i);

  if (!match) {
    throw new Error(
      "Event time must be provided in a consistent HH:MM format.",
    );
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const isAmPm = Boolean(match[3]);
  const meridiem = match[4]?.toUpperCase();

  if (minutes > 59) {
    throw new Error("Event time minutes must be between 00 and 59.");
  }

  let normalizedHours = hours;

  if (isAmPm) {
    if (meridiem === "AM") {
      normalizedHours = hours === 12 ? 0 : hours;
    } else {
      normalizedHours = hours === 12 ? 12 : hours + 12;
    }
  }

  if (normalizedHours < 0 || normalizedHours > 23) {
    throw new Error("Event time hour must be between 00 and 23.");
  }

  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Event title is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Event title cannot be empty.",
      },
    },
    slug: {
      type: String,
      required: [true, "Event slug is required."],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Event description cannot be empty.",
      },
    },
    overview: {
      type: String,
      required: [true, "Event overview is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Event overview cannot be empty.",
      },
    },
    image: {
      type: String,
      required: [true, "Event image is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Event image cannot be empty.",
      },
    },
    venue: {
      type: String,
      required: [true, "Event venue is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Event venue cannot be empty.",
      },
    },
    location: {
      type: String,
      required: [true, "Event location is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Event location cannot be empty.",
      },
    },
    date: {
      type: String,
      required: [true, "Event date is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Event date cannot be empty.",
      },
    },
    time: {
      type: String,
      required: [true, "Event time is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Event time cannot be empty.",
      },
    },
    mode: {
      type: String,
      required: [true, "Event mode is required."],
      enum: ["online", "offline", "hybrid"],
      trim: true,
    },
    audience: {
      type: String,
      required: [true, "Audience is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Audience cannot be empty.",
      },
    },
    agenda: {
      type: [String],
      required: [true, "Agenda is required."],
      validate: {
        validator: (value: string[]) => value.length > 0,
        message: "Agenda must contain at least one item.",
      },
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required."],
      trim: true,
      validate: {
        validator: (value: string) => value.trim().length > 0,
        message: "Organizer cannot be empty.",
      },
    },
    tags: {
      type: [String],
      required: [true, "Tags are required."],
      validate: {
        validator: (value: string[]) => value.length > 0,
        message: "Tags must contain at least one item.",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Generate a URL-friendly slug from the title and only regenerate when the title changes.
eventSchema.pre("save", async function () {
  const title = normalizeWhitespace(this.title);

  if (!title) {
    throw new Error("Event title cannot be empty.");
  }

  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(title);
  }

  // Normalize the event date to ISO format and keep a consistent time format.
  this.date = normalizeDate(this.date);
  this.time = normalizeTime(this.time);
});

export const Event =
  (mongoose.models.Event as mongoose.Model<IEvent>) ||
  mongoose.model<IEvent>("Event", eventSchema);
