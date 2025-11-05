// server/api/public/settings.get.ts
import { getDB } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    // Timeout geral de 10 segundos para conectar (Vercel pode ter cold start)
    const dbPromise = getDB();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao conectar MongoDB')), 10000)
    );
    
    let db;
    try {
      db = await Promise.race([dbPromise, timeoutPromise]) as any;
      console.log('[public/settings] ✅ Conexão com MongoDB estabelecida');
    } catch (dbError: any) {
      console.error('[public/settings] ❌ Erro/timeout ao conectar MongoDB:', {
        message: dbError?.message,
        name: dbError?.name
      });
      throw dbError; // Vai cair no catch principal e retornar valores padrão
    }
    
    const settings = db.collection("settings");
    
    // Timeout de 5 segundos para a query
    const queryPromise = settings.findOne({ _id: "store-config" }, {
      maxTimeMS: 5000
    });
    const queryTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na query')), 5000)
    );
    
    let storeSettings;
    try {
      storeSettings = await Promise.race([queryPromise, queryTimeout]) as any;
      
      // Se não encontrar pelo _id, tenta sem filtro (só se a primeira query funcionou)
      if (!storeSettings) {
        console.log('[public/settings] ⚠️ Não encontrado com _id, tentando buscar sem filtro...');
        storeSettings = await settings.findOne({}, {
          maxTimeMS: 3000
        });
      }
      
      if (storeSettings) {
        console.log('[public/settings] ✅ Configurações encontradas no banco');
      } else {
        console.log('[public/settings] ⚠️ Nenhuma configuração encontrada no banco');
      }
    } catch (queryError: any) {
      console.error('[public/settings] ❌ Erro/timeout na query:', {
        message: queryError?.message,
        name: queryError?.name
      });
      storeSettings = null; // Forçar valores padrão
    }
    
    // Se não existir configurações, retornar valores padrão
    if (!storeSettings) {
      console.log('[public/settings] ⚠️ Retornando valores padrão');
      // Calcular status baseado em horários padrão (fechado por segurança)
      return {
        storeName: "Minha Loja",
        logo: "",
        banner: "",
        isOpen: false,
        deliveryMinTime: 30,
        deliveryMaxTime: 60,
        deliveryFee: 0,
        minimumOrder: 0,
        storeAddress: "",
        storePhone: "",
        whatsapp: "",
        storeLatitude: -23.5505,
        storeLongitude: -46.6333,
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
        deliveryZones: [
          {
            name: "Zona 1",
            maxDistance: 5,
            fee: 5,
            cepRanges: ["01", "02", "03", "04", "05", "06", "07"]
          },
          {
            name: "Zona 2", 
            maxDistance: 10,
            fee: 10,
            cepRanges: ["08"]
          },
          {
            name: "Zona 3",
            maxDistance: 15,
            fee: 15,
            cepRanges: []
          }
        ]
      };
    }
    
    // Calcular se está aberto agora baseado nos horários, respeitando fuso horário
    const timeZone = process.env.TZ || 'America/Sao_Paulo'
    const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone }))
    const currentDay = nowLocal.getDay();
    const currentTime = `${String(nowLocal.getHours()).padStart(2, '0')}:${String(nowLocal.getMinutes()).padStart(2, '0')}`;
    
    const todaySchedule = storeSettings.openingHours?.find((h: any) => h.day === currentDay);
    let isOpen = false;
    
    if (todaySchedule && todaySchedule.enabled) {
      isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
    }
    
    // Retornar apenas as configurações públicas necessárias
    // Mapear corretamente os dados do banco
    const result = {
      storeName: storeSettings.storeName || "Minha Loja",
      logo: storeSettings.logo || "",
      banner: storeSettings.banner || "",
      isOpen: isOpen,
      deliveryMinTime: storeSettings.deliveryMinTime || 30,
      deliveryMaxTime: storeSettings.deliveryMaxTime || 60,
      deliveryFee: storeSettings.deliveryFee !== undefined ? storeSettings.deliveryFee : 0,
      minimumOrder: storeSettings.minimumOrder !== undefined ? storeSettings.minimumOrder : 0,
      storeAddress: storeSettings.location?.address || storeSettings.storeAddress || "",
      storePhone: storeSettings.storePhone || "",
      whatsapp: storeSettings.whatsapp || "",
      storeLatitude: storeSettings.location?.latitude || storeSettings.storeLatitude || -23.5505,
      storeLongitude: storeSettings.location?.longitude || storeSettings.storeLongitude || -46.6333,
      checkoutFields: storeSettings.checkoutFields || {
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
      deliveryZones: Array.isArray(storeSettings.deliveryZones) && storeSettings.deliveryZones.length > 0
        ? storeSettings.deliveryZones
        : [
            {
              name: "Zona 1",
              maxDistance: 5,
              fee: 5,
              cepRanges: ["01", "02", "03", "04", "05", "06", "07"]
            },
            {
              name: "Zona 2", 
              maxDistance: 10,
              fee: 10,
              cepRanges: ["08"]
            },
            {
              name: "Zona 3",
              maxDistance: 15,
              fee: 15,
              cepRanges: []
            }
          ]
    };
    
    console.log('[public/settings] ✅ Retornando configurações:', {
      hasDeliveryZones: Array.isArray(result.deliveryZones) && result.deliveryZones.length > 0,
      hasCheckoutFields: !!result.checkoutFields,
      storeName: result.storeName
    });
    
    return result;
  } catch (error: any) {
    console.error('[public/settings] ❌ Erro ao buscar configurações públicas:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    
    // Em caso de erro, retornar valores padrão (fechado por segurança)
    return {
      storeName: "Minha Loja",
      logo: "",
      banner: "",
      isOpen: false,
      deliveryMinTime: 30,
      deliveryMaxTime: 60,
      deliveryFee: 0,
      minimumOrder: 0,
      storeAddress: "",
      storePhone: "",
      whatsapp: "",
      storeLatitude: -23.5505,
      storeLongitude: -46.6333,
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
      deliveryZones: [
        {
          name: "Zona 1",
          maxDistance: 5,
          fee: 5,
          cepRanges: ["01", "02", "03", "04", "05", "06", "07"]
        },
        {
          name: "Zona 2", 
          maxDistance: 10,
          fee: 10,
          cepRanges: ["08"]
        },
        {
          name: "Zona 3",
          maxDistance: 15,
          fee: 15,
          cepRanges: []
        }
      ]
    };
  }
});
