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
    
    const db = await getDB();
    
    const settings = db.collection("settings");
    
    // Buscar as configurações (sempre haverá apenas um documento) com timeout
    let config = await settings.findOne({ _id: "store-config" }, {
      maxTimeMS: 5000 // Timeout de 5 segundos
    });
    
    // Se não existir, criar com valores padrão
    if (!config) {
      config = {
        _id: "store-config",
        storeName: "Minha Loja",
        logo: "/logo.jpg",
        banner: "/not_found.jpg",
        infoImage: "",
        storePhone: "",
        whatsapp: "",
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
        enabledPaymentMethods: {
          pix: true,
          dinheiro: true,
          cartao: true
        },
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
        restrictedZipCodes: [],
        manualOverride: null, // null = usar horário automático, true/false = override manual
        storeMode: 'automatic', // 'automatic' ou 'manual'
        primaryColor: '#ff8e24', // Cor primária da plataforma
        updatedAt: new Date(),
        createdAt: new Date()
      };
      
      await settings.insertOne(config);
    }
    
    // Calcular se está aberto agora respeitando fuso horário
    // Sanitizar e validar o timezone para evitar erros
    let timeZone = 'America/Sao_Paulo'; // Fallback padrão
    try {
      const envTZ = process.env.TZ;
      if (envTZ && envTZ.trim() && !envTZ.startsWith(':')) {
        // Validar se o timezone é válido tentando usá-lo
        try {
          new Date().toLocaleString('en-US', { timeZone: envTZ.trim() });
          timeZone = envTZ.trim();
        } catch (tzError) {
          console.warn('[settings.get] ⚠️ Timezone inválido do env:', envTZ, 'usando fallback');
        }
      }
    } catch (tzParseError) {
      console.warn('[settings.get] ⚠️ Erro ao processar TZ:', tzParseError);
    }
    
    // Verificar se há override manual primeiro
    let isOpen = false;
    if (config.manualOverride !== undefined && config.manualOverride !== null) {
      // Se houver override manual, usar ele diretamente
      isOpen = config.manualOverride;
    } else {
      // Caso contrário, calcular baseado nos horários
      try {
        const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone }));
        const currentDay = nowLocal.getDay();
        const currentTime = `${String(nowLocal.getHours()).padStart(2, '0')}:${String(nowLocal.getMinutes()).padStart(2, '0')}`;
        
        const todaySchedule = config.openingHours?.find((h: any) => h.day === currentDay);
        
        if (todaySchedule && todaySchedule.enabled) {
          isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
        }
      } catch (timeCalcError: any) {
        console.error('[settings.get] ⚠️ Erro ao calcular horário de abertura:', {
          message: timeCalcError?.message,
          timeZone: timeZone
        });
        // Se houver erro, assumir que está fechado por segurança
        isOpen = false;
      }
    }
    
    
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

