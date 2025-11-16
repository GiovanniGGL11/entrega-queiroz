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
    const body = await readBody(event);
    const { 
      storeName, 
      logo, 
      banner,
      storePhone,
      whatsapp,
      location,
      deliveryZones,
      openingHours,
      deliveryMinTime, 
      deliveryMaxTime,
      deliveryFee,
      minimumOrder,
      enabledPaymentMethods,
      checkoutFields,
      restrictedZipCodes,
      manualOverride,
      storeMode
    } = body;
    
    // Validações
    if (storeName !== undefined && (!storeName || storeName.trim() === '')) {
      throw createError({
        statusCode: 400,
        message: "Nome da loja é obrigatório",
      });
    }
    
    if (deliveryMinTime !== undefined && deliveryMinTime < 0) {
      throw createError({
        statusCode: 400,
        message: "Tempo mínimo de entrega deve ser maior ou igual a 0",
      });
    }
    
    if (deliveryMaxTime !== undefined && deliveryMaxTime < deliveryMinTime) {
      throw createError({
        statusCode: 400,
        message: "Tempo máximo de entrega deve ser maior que o tempo mínimo",
      });
    }
    
    if (deliveryFee !== undefined && deliveryFee < 0) {
      throw createError({
        statusCode: 400,
        message: "Taxa de entrega deve ser maior ou igual a 0",
      });
    }
    
    if (minimumOrder !== undefined && minimumOrder < 0) {
      throw createError({
        statusCode: 400,
        message: "Pedido mínimo deve ser maior ou igual a 0",
      });
    }
    
    // Validar campos do checkout
    if (checkoutFields !== undefined) {
      if (typeof checkoutFields !== 'object' || checkoutFields === null) {
        throw createError({
          statusCode: 400,
          message: "Campos do checkout devem ser um objeto válido",
        });
      }
      
      const validFields = [
        'customerName', 'customerPhone', 'customerEmail',
        'deliveryAddress', 'deliveryComplement', 'deliveryNeighborhood',
        'deliveryCity', 'deliveryZipCode', 'paymentMethod', 'notes'
      ];
      
      for (const fieldName of validFields) {
        if (checkoutFields[fieldName] !== undefined) {
          const field = checkoutFields[fieldName];
          if (typeof field !== 'object' || field === null) {
            throw createError({
              statusCode: 400,
              message: `Campo ${fieldName} deve ser um objeto válido`,
            });
          }
          
          if (typeof field.enabled !== 'boolean') {
            throw createError({
              statusCode: 400,
              message: `Campo ${fieldName}.enabled deve ser um booleano`,
            });
          }
          
          if (typeof field.required !== 'boolean') {
            throw createError({
              statusCode: 400,
              message: `Campo ${fieldName}.required deve ser um booleano`,
            });
          }
        }
      }
    }
    
    // Validar horários de funcionamento
    if (openingHours !== undefined) {
      if (!Array.isArray(openingHours) || openingHours.length !== 7) {
        throw createError({
          statusCode: 400,
          message: "Horários de funcionamento inválidos",
        });
      }
      
      for (const schedule of openingHours) {
        if (schedule.enabled && (!schedule.open || !schedule.close)) {
          throw createError({
            statusCode: 400,
            message: "Horários de abertura e fechamento são obrigatórios quando o dia está habilitado",
          });
        }
        
        if (schedule.enabled && schedule.open >= schedule.close) {
          throw createError({
            statusCode: 400,
            message: "Horário de fechamento deve ser posterior ao de abertura",
          });
        }
      }
    }

    const db = await getDB();
    const settings = db.collection("settings");
    
    // Construir objeto de atualização dinamicamente
    const updateFields: { [key: string]: any } = {
      updatedAt: new Date(),
    };
    
    if (storeName !== undefined) updateFields.storeName = storeName.trim();
    if (logo !== undefined) updateFields.logo = logo.trim();
    if (banner !== undefined) updateFields.banner = banner.trim();
    if (storePhone !== undefined) updateFields.storePhone = storePhone.trim();
    if (whatsapp !== undefined) updateFields.whatsapp = whatsapp.trim();
    if (location !== undefined) updateFields.location = location;
    if (deliveryZones !== undefined) updateFields.deliveryZones = deliveryZones;
    if (openingHours !== undefined) updateFields.openingHours = openingHours;
    if (deliveryMinTime !== undefined) updateFields.deliveryMinTime = parseInt(deliveryMinTime);
    if (deliveryMaxTime !== undefined) updateFields.deliveryMaxTime = parseInt(deliveryMaxTime);
    if (deliveryFee !== undefined) updateFields.deliveryFee = parseFloat(deliveryFee);
    if (minimumOrder !== undefined) updateFields.minimumOrder = parseFloat(minimumOrder);
    if (enabledPaymentMethods !== undefined) {
      // Validar estrutura de enabledPaymentMethods
      if (typeof enabledPaymentMethods !== 'object' || enabledPaymentMethods === null) {
        throw createError({
          statusCode: 400,
          message: "Métodos de pagamento habilitados devem ser um objeto válido",
        });
      }
      updateFields.enabledPaymentMethods = enabledPaymentMethods;
    }
    if (checkoutFields !== undefined) updateFields.checkoutFields = checkoutFields;
    if (manualOverride !== undefined) {
      // Validar que é um booleano ou null
      if (manualOverride !== null && typeof manualOverride !== 'boolean') {
        throw createError({
          statusCode: 400,
          message: "Override manual deve ser um booleano ou null",
        });
      }
      updateFields.manualOverride = manualOverride;
    }
    if (restrictedZipCodes !== undefined) {
      // Validar que é um array
      if (!Array.isArray(restrictedZipCodes)) {
        throw createError({
          statusCode: 400,
          message: "CEPs restritos devem ser um array",
        });
      }
      // Limpar e validar CEPs (remover hífen e espaços)
      const cleanedZipCodes = restrictedZipCodes
        .map((zip: string) => (zip || '').replace(/\D/g, ''))
        .filter((zip: string) => zip.length === 8)
        .map((zip: string) => zip.substring(0, 5) + '-' + zip.substring(5, 8));
      updateFields.restrictedZipCodes = cleanedZipCodes;
    }
    if (storeMode !== undefined) {
      // Validar que é 'automatic' ou 'manual'
      if (storeMode !== 'automatic' && storeMode !== 'manual') {
        throw createError({
          statusCode: 400,
          message: "Modo da loja deve ser 'automatic' ou 'manual'",
        });
      }
      updateFields.storeMode = storeMode;
      
      // Se mudou para automático, limpar override manual
      if (storeMode === 'automatic') {
        updateFields.manualOverride = null;
      }
    }

    const result = await settings.updateOne(
      { _id: "store-config" },
      { 
        $set: updateFields,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    
    // Buscar a configuração atualizada
    const updatedConfig = await settings.findOne({ _id: "store-config" });
    
    // Calcular se está aberto agora (considerando override manual)
    let isOpen = false;
    if (updatedConfig.manualOverride !== undefined && updatedConfig.manualOverride !== null) {
      // Se houver override manual, usar ele diretamente
      isOpen = updatedConfig.manualOverride;
    } else {
      // Caso contrário, calcular baseado nos horários
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const todaySchedule = updatedConfig.openingHours?.find((h: any) => h.day === currentDay);
      
      if (todaySchedule && todaySchedule.enabled) {
        isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
      }
    }
    
    return { 
      message: "Configurações atualizadas com sucesso",
      settings: {
        ...updatedConfig,
        isOpen
      }
    };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    console.error("Erro ao atualizar configurações:", err);
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao atualizar configurações da loja" 
    });
  }
});

