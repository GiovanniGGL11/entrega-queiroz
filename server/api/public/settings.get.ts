// server/api/public/settings.get.ts
import { getDB } from "../../utils/db";

export default defineEventHandler(async (event) => {
  // Adicionar headers para evitar cache
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  setHeader(event, 'Pragma', 'no-cache');
  setHeader(event, 'Expires', '0');
  
  try {
    // Log da URI do MongoDB (sem senha) para debug
    const mongoUri = process.env.MONGODB_URI || 'NÃO DEFINIDA';
    const mongoUriMasked = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('[public/settings] 🔍 MongoDB URI:', mongoUriMasked);
    console.log('[public/settings] 🔍 Ambiente:', process.env.NODE_ENV || 'development');
    
    // Timeout geral de 10 segundos para conectar (Vercel pode ter cold start)
    const dbPromise = getDB();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao conectar MongoDB')), 10000)
    );
    
    let db;
    try {
      db = await Promise.race([dbPromise, timeoutPromise]) as any;
      console.log('[public/settings] ✅ Conexão com MongoDB estabelecida');
      console.log('[public/settings] 🔍 Nome do banco:', db.databaseName);
    } catch (dbError: any) {
      console.error('[public/settings] ❌ Erro/timeout ao conectar MongoDB:', {
        message: dbError?.message,
        name: dbError?.name,
        stack: dbError?.stack
      });
      throw dbError; // Vai cair no catch principal e retornar valores padrão
    }
    
    const settings = db.collection("settings");
    
    // Primeiro, verificar quantos documentos existem na coleção (para debug)
    let allDocs: any[] = [];
    try {
      const count = await settings.countDocuments({});
      console.log(`[public/settings] 📊 Total de documentos na coleção: ${count}`);
      
      if (count > 0) {
        // Listar todos os documentos para debug
        allDocs = await settings.find({}).limit(5).toArray();
        console.log('[public/settings] 📋 Documentos encontrados:', allDocs.map(doc => ({
          _id: doc._id,
          _idType: typeof doc._id,
          _idString: String(doc._id),
          storeName: doc.storeName || 'N/A',
          hasDeliveryZones: !!doc.deliveryZones,
          hasCheckoutFields: !!doc.checkoutFields
        })));
      }
    } catch (countError: any) {
      console.error('[public/settings] ⚠️ Erro ao contar documentos:', countError?.message);
    }
    
    // Timeout de 5 segundos para a query
    let storeSettings = null;
    
    try {
      // Tentar buscar com _id como string primeiro
      const queryPromise1 = settings.findOne({ _id: "store-config" }, {
        maxTimeMS: 5000
      });
      const queryTimeout1 = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na query 1')), 5000)
      );
      
      storeSettings = await Promise.race([queryPromise1, queryTimeout1]) as any;
      
      if (storeSettings) {
        console.log('[public/settings] ✅ Configurações encontradas com _id="store-config"');
      } else {
        // Se não encontrar, usar o primeiro documento da lista se existir
        if (allDocs.length > 0) {
          console.log('[public/settings] ⚠️ Não encontrado com _id="store-config", usando primeiro documento da lista...');
          storeSettings = allDocs[0];
          console.log('[public/settings] ✅ Usando primeiro documento encontrado');
        } else {
          // Se não houver documentos na lista, tentar buscar qualquer documento
          console.log('[public/settings] ⚠️ Nenhum documento na lista, tentando buscar qualquer documento...');
          const queryPromise2 = settings.findOne({}, {
            maxTimeMS: 3000
          });
          const queryTimeout2 = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na query 2')), 3000)
          );
          
          storeSettings = await Promise.race([queryPromise2, queryTimeout2]) as any;
          
          if (storeSettings) {
            console.log('[public/settings] ✅ Configurações encontradas sem filtro');
          } else {
            console.log('[public/settings] ⚠️ Nenhuma configuração encontrada no banco');
          }
        }
      }
      
      if (storeSettings) {
        console.log('[public/settings] 📦 Dados encontrados:', {
          _id: storeSettings._id,
          _idType: typeof storeSettings._id,
          _idString: String(storeSettings._id),
          storeName: storeSettings.storeName,
          hasDeliveryZones: Array.isArray(storeSettings.deliveryZones),
          deliveryZonesCount: Array.isArray(storeSettings.deliveryZones) ? storeSettings.deliveryZones.length : 0,
          hasCheckoutFields: !!storeSettings.checkoutFields,
          hasLocation: !!storeSettings.location,
          deliveryZonesType: typeof storeSettings.deliveryZones,
          checkoutFieldsType: typeof storeSettings.checkoutFields
        });
        
        // Log completo do documento (sem _id para evitar problemas de serialização)
        const { _id, ...docWithoutId } = storeSettings;
        console.log('[public/settings] 📋 Documento completo (sem _id):', JSON.stringify(docWithoutId, null, 2));
        
        // Log específico dos campos críticos
        console.log('[public/settings] 🎯 deliveryZones raw:', JSON.stringify(storeSettings.deliveryZones));
        console.log('[public/settings] 🎯 checkoutFields raw:', JSON.stringify(storeSettings.checkoutFields));
      }
    } catch (queryError: any) {
      console.error('[public/settings] ❌ Erro/timeout na query:', {
        message: queryError?.message,
        name: queryError?.name,
        stack: queryError?.stack
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
          console.warn('[public/settings] ⚠️ Timezone inválido do env:', envTZ, 'usando fallback');
        }
      }
    } catch (tzParseError) {
      console.warn('[public/settings] ⚠️ Erro ao processar TZ:', tzParseError);
    }
    
    // Verificar se há override manual primeiro
    let isOpen = false;
    if (storeSettings.manualOverride !== undefined && storeSettings.manualOverride !== null) {
      // Se houver override manual, usar ele diretamente
      isOpen = storeSettings.manualOverride;
    } else {
      // Caso contrário, calcular baseado nos horários
      try {
        const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone }));
        const currentDay = nowLocal.getDay();
        const currentTime = `${String(nowLocal.getHours()).padStart(2, '0')}:${String(nowLocal.getMinutes()).padStart(2, '0')}`;
        
        const todaySchedule = storeSettings.openingHours?.find((h: any) => h.day === currentDay);
        
        if (todaySchedule && todaySchedule.enabled) {
          isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
        }
      } catch (timeCalcError: any) {
        console.error('[public/settings] ⚠️ Erro ao calcular horário de abertura:', {
          message: timeCalcError?.message,
          timeZone: timeZone
        });
        // Se houver erro, assumir que está fechado por segurança
        isOpen = false;
      }
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
      checkoutFields: (storeSettings.checkoutFields && typeof storeSettings.checkoutFields === 'object')
        ? storeSettings.checkoutFields
        : {
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
      deliveryZones: Array.isArray(storeSettings.deliveryZones)
        ? storeSettings.deliveryZones  // Usar os dados do banco mesmo se estiver vazio
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
    
    // Garantir que os dados sejam serializáveis (remover _id e outros campos do MongoDB)
    const serializedResult = {
      storeName: String(result.storeName || "Minha Loja"),
      logo: String(result.logo || ""),
      banner: String(result.banner || ""),
      isOpen: Boolean(result.isOpen),
      deliveryMinTime: Number(result.deliveryMinTime || 30),
      deliveryMaxTime: Number(result.deliveryMaxTime || 60),
      deliveryFee: Number(result.deliveryFee || 0),
      minimumOrder: Number(result.minimumOrder || 0),
      storeAddress: String(result.storeAddress || ""),
      storePhone: String(result.storePhone || ""),
      whatsapp: String(result.whatsapp || ""),
      storeLatitude: Number(result.storeLatitude || -23.5505),
      storeLongitude: Number(result.storeLongitude || -46.6333),
      checkoutFields: (result.checkoutFields && typeof result.checkoutFields === 'object') 
        ? JSON.parse(JSON.stringify(result.checkoutFields)) // Garantir serialização
        : {
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
      deliveryZones: Array.isArray(result.deliveryZones) ? result.deliveryZones.map((zone: any) => ({
        name: String(zone.name || ""),
        maxDistance: Number(zone.maxDistance || 0),
        fee: Number(zone.fee || 0),
        cepRanges: Array.isArray(zone.cepRanges) ? zone.cepRanges.map((r: any) => String(r)) : []
      })) : []
    };
    
    console.log('[public/settings] ✅ Retornando configurações:', {
      hasDeliveryZones: Array.isArray(serializedResult.deliveryZones) && serializedResult.deliveryZones.length > 0,
      hasCheckoutFields: !!serializedResult.checkoutFields,
      storeName: serializedResult.storeName,
      deliveryZonesCount: serializedResult.deliveryZones.length,
      deliveryZonesSample: serializedResult.deliveryZones.length > 0 ? serializedResult.deliveryZones[0] : null
    });
    
    // Log do resultado serializado completo para debug
    console.log('[public/settings] 📤 Resultado final serializado:', JSON.stringify(serializedResult, null, 2));
    
    return serializedResult;
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
