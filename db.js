import { MongoClient } from 'mongodb';

const client = new MongoClient("mongodb://127.0.0.1:27017");

let db;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db("rca_app");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1); // stop the server if DB fails
  }
}

export function getDb() {
  if (!db) throw new Error("DB not initialized. Call connectDB() first.");
  return db;
}