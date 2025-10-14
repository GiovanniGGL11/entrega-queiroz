// server/utils/db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!clientPromise) {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDB() {
  try {
    await clientPromise;
    return client.db("queiroz_hamburgueria");
  } catch (e) {
    throw new Error("Failed to connect to MongoDB");
  }
}
