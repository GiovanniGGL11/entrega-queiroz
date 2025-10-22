import { getDB } from "../utils/db";
import { verifyUserToken } from "../utils/auth";
import { getRequestHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  // Autenticação direta sem middleware
  const authHeader = getRequestHeader(event, 'authorization')
  let token = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token de autenticação necessário'
    })
  }
  
  // Verificar token
  try {
    const decoded = verifyUserToken(token)
    // Token válido, continuar
  } catch (jwtError) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido ou expirado'
    })
  }
  
  try {
    console.log('[settings.get] Iniciando busca de configurações...');
    
    const db = await getDB();
    console.log('[settings.get] Conexão com DB estabelecida');
    
    const settings = db.collection("settings");
    
    // Buscar as configurações (sempre haverá apenas um documento)
    let config = await settings.findOne({ _id: "store-config" });
    console.log('[settings.get] Config encontrado:', config ? 'SIM' : 'NÃO');
    
    // Se não existir, criar com valores padrão
    if (!config) {
      console.log('[settings.get] Criando configuração padrão...');
      config = {
        _id: "store-config",
        storeName: "Minha Loja",
        logo: "/logo.jpg",
        banner: "/not_found.jpg",
        location: {
          address: "",
          latitude: -23.550520, // São Paulo como padrão
          longitude: -46.633308
        },
        deliveryZones: [
          { maxDistance: 3, fee: 0, label: "Até 3km - Grátis" },
          { maxDistance: 5, fee: 5.00, label: "3-5km - R$ 5,00" },
          { maxDistance: 10, fee: 10.00, label: "5-10km - R$ 10,00" },
          { maxDistance: 15, fee: 15.00, label: "10-15km - R$ 15,00" }
        ],
        openingHours: [
          { day: 0, open: "11:00", close: "22:00", enabled: false }, // Domingo
          { day: 1, open: "11:00", close: "22:00", enabled: true },  // Segunda
          { day: 2, open: "11:00", close: "22:00", enabled: true },  // Terça
          { day: 3, open: "11:00", close: "22:00", enabled: true },  // Quarta
          { day: 4, open: "11:00", close: "22:00", enabled: true },  // Quinta
          { day: 5, open: "11:00", close: "22:00", enabled: true },  // Sexta
          { day: 6, open: "11:00", close: "23:00", enabled: true },  // Sábado
        ],
        deliveryMinTime: 30,
        deliveryMaxTime: 60,
        deliveryFee: 5.00, // Taxa padrão (será calculada por distância)
        minimumOrder: 0,
        checkoutFields: {
          customerName: { enabled: true, required: true },
          customerPhone: { enabled: true, required: true },
          customerEmail: { enabled: true, required: false },
          deliveryAddress: { enabled: true, required: true },
          deliveryComplement: { enabled: true, required: false },
          deliveryNeighborhood: { enabled: true, required: true },
          deliveryCity: { enabled: true, required: true },
          deliveryZipCode: { enabled: true, required: true },
          paymentMethod: { enabled: true, required: true },
          notes: { enabled: true, required: false }
        },
        updatedAt: new Date(),
        createdAt: new Date()
      };
      
      await settings.insertOne(config);
      console.log('[settings.get] Configuração padrão criada com sucesso');
    }
    
    // Calcular se está aberto agora
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const todaySchedule = config.openingHours?.find((h: any) => h.day === currentDay);
    let isOpen = false;
    
    if (todaySchedule && todaySchedule.enabled) {
      isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
    }
    
    console.log('[settings.get] Retornando configurações - isOpen:', isOpen);
    
    return {
      ...config,
      isOpen
    };
  } catch (error: any) {
    console.error("[settings.get] ERRO DETALHADO:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    throw createError({ 
      statusCode: 500, 
      message: `Erro ao buscar configurações: ${error.message}`,
      data: {
        errorType: error.name,
        errorCode: error.code,
        details: error.message
      }
    });
  }
});

