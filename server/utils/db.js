// server/utils/db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

// Em ambientes serverless como Vercel, precisamos usar cache global
if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, use uma variável global para preservar o valor através dos reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Em produção, é melhor não usar variáveis globais
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDB() {
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db("queiroz_hamburgueria");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
}
