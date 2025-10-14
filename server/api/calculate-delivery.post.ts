import { getDB } from "../utils/db";

// Fórmula de Haversine para calcular distância entre dois pontos
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { latitude, longitude } = body;
    
    if (latitude === undefined || longitude === null) {
      throw createError({
        statusCode: 400,
        message: "Latitude e longitude são obrigatórias",
      });
    }
    
    // Buscar configurações da loja
    const db = await getDB();
    const settings = db.collection("settings");
    const config = await settings.findOne({ _id: "store-config" });
    
    if (!config || !config.location) {
      throw createError({
        statusCode: 500,
        message: "Configurações da loja não encontradas",
      });
    }
    
    // Calcular distância
    const distance = calculateDistance(
      config.location.latitude,
      config.location.longitude,
      parseFloat(latitude),
      parseFloat(longitude)
    );
    
    // Encontrar zona de entrega correspondente
    const deliveryZones = config.deliveryZones || [];
    let deliveryFee = null;
    let deliveryZone = null;
    let canDeliver = false;
    
    // Ordenar zonas por distância máxima
    const sortedZones = [...deliveryZones].sort((a, b) => a.maxDistance - b.maxDistance);
    
    for (const zone of sortedZones) {
      if (distance <= zone.maxDistance) {
        deliveryFee = zone.fee;
        deliveryZone = zone;
        canDeliver = true;
        break;
      }
    }
    
    // Se não encontrou zona, não entrega
    if (!canDeliver) {
      return {
        canDeliver: false,
        distance: parseFloat(distance.toFixed(2)),
        message: "Desculpe, não entregamos nesta região",
        maxDistance: sortedZones.length > 0 ? sortedZones[sortedZones.length - 1].maxDistance : 0
      };
    }
    
    return {
      canDeliver: true,
      distance: parseFloat(distance.toFixed(2)),
      deliveryFee: deliveryFee,
      deliveryZone: deliveryZone.label,
      estimatedTime: `${config.deliveryMinTime}-${config.deliveryMaxTime} min`
    };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    console.error("Erro ao calcular entrega:", err);
    throw createError({
      statusCode: 500,
      message: "Erro ao calcular taxa de entrega",
    });
  }
});


