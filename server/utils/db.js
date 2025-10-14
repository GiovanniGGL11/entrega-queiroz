// server/utils/db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  const errorMsg = 'MONGODB_URI não está definida nas variáveis de ambiente!';
  console.error('[DB] ERRO CRÍTICO:', errorMsg);
  throw new Error(errorMsg);
}

console.log('[DB] MONGODB_URI encontrada:', uri.substring(0, 20) + '...');

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

// Em ambientes serverless como Vercel, precisamos usar cache global
if (process.env.NODE_ENV === 'development') {
  console.log('[DB] Modo: DEVELOPMENT');
  // Em desenvolvimento, use uma variável global para preservar o valor através dos reloads
  if (!global._mongoClientPromise) {
    console.log('[DB] Criando nova conexão (development)...');
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  } else {
    console.log('[DB] Usando conexão existente (development)');
  }
  clientPromise = global._mongoClientPromise;
} else {
  console.log('[DB] Modo: PRODUCTION');
  // Em produção, é melhor não usar variáveis globais
  console.log('[DB] Criando nova conexão (production)...');
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDB() {
  try {
    console.log('[DB] Tentando conectar ao MongoDB...');
    const connectedClient = await clientPromise;
    console.log('[DB] ✅ Conexão estabelecida com sucesso!');
    const db = connectedClient.db("queiroz_hamburgueria");
    console.log('[DB] Database selecionado: queiroz_hamburgueria');
    return db;
  } catch (error) {
    console.error("[DB] ❌ ERRO DE CONEXÃO:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      uri: uri ? uri.substring(0, 30) + '...' : 'undefined'
    });
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
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
