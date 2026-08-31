import mongoose, { type Mongoose } from "mongoose";

/**
 * Resolve the MongoDB connection string at startup.
 * This keeps the environment variable check explicit and ensures the type is
 * narrowed to a real string before the connection is created.
 */
const getMongoDbUri = (): string => {
  const mongoDbUri = process.env.MONGODB_URI;

  if (!mongoDbUri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local",
    );
  }

  return mongoDbUri;
};

const MONGODB_URI = getMongoDbUri();

/**
 * Cache the connection in development so we do not create a new MongoDB
 * connection on every hot reload. In production, Node keeps a single process
 * alive, so the cached instance is still safe and efficient.
 */
type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached;
}

/**
 * Connect to MongoDB once and reuse the cached connection.
 * This pattern is recommended for Next.js apps to avoid exhausting DB resources
 * during local development when modules may be re-evaluated frequently.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoOptions: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, mongoOptions)
      .then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        return mongooseInstance;
      });
  }

  try {
    return await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

export default connectToDatabase;
