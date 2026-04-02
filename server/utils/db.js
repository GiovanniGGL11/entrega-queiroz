// server/utils/db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  const errorMsg = 'MONGODB_URI não está definida nas variáveis de ambiente!';
  console.error('[DB] ERRO CRÍTICO:', errorMsg);
  throw new Error(errorMsg);
}

const options = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000, // Reduzido para 5s
  socketTimeoutMS: 30000,
  connectTimeoutMS: 5000,
  maxIdleTimeMS: 30000,
};

// Para ambientes serverless (Vercel), usar globalThis
const globalForMongo = globalThis;

let client;
let clientPromise;

// Reutilizar conexão em ambientes serverless (Vercel)
if (!globalForMongo._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalForMongo._mongoClientPromise = client.connect();
}

clientPromise = globalForMongo._mongoClientPromise;

export async function getDB() {
  try {
    // Se a conexão foi perdida, criar nova
    if (!globalForMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalForMongo._mongoClientPromise = client.connect();
      clientPromise = globalForMongo._mongoClientPromise;
    }
    
    const connectedClient = await clientPromise;
    const db = connectedClient.db("queiroz_hamburgueria");
    return db;
  } catch (error) {
    console.error("[DB] ❌ ERRO DE CONEXÃO:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    
    // Limpar conexão em caso de erro para tentar reconectar
    globalForMongo._mongoClientPromise = null;
    clientPromise = null;
    
    throw error;
  }
}

// Alias para compatibilidade
export async function connectToDatabase() {
  const db = await getDB();
  return { db };
}

// Alias para compatibilidade
export async function connectDB() {
  return await getDB();
}
