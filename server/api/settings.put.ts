import { getDB } from "../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { 
      storeName, 
      logo, 
      banner,
      location,
      deliveryZones,
      openingHours,
      deliveryMinTime, 
      deliveryMaxTime,
      deliveryFee,
      minimumOrder
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
    if (location !== undefined) updateFields.location = location;
    if (deliveryZones !== undefined) updateFields.deliveryZones = deliveryZones;
    if (openingHours !== undefined) updateFields.openingHours = openingHours;
    if (deliveryMinTime !== undefined) updateFields.deliveryMinTime = parseInt(deliveryMinTime);
    if (deliveryMaxTime !== undefined) updateFields.deliveryMaxTime = parseInt(deliveryMaxTime);
    if (deliveryFee !== undefined) updateFields.deliveryFee = parseFloat(deliveryFee);
    if (minimumOrder !== undefined) updateFields.minimumOrder = parseFloat(minimumOrder);

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
    
    // Calcular se está aberto agora
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const todaySchedule = updatedConfig.openingHours?.find((h: any) => h.day === currentDay);
    let isOpen = false;
    
    if (todaySchedule && todaySchedule.enabled) {
      isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
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

