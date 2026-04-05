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
    const { zipCode, latitude, longitude } = body;
    
    
    // Buscar configurações da loja
    const db = await getDB();
    const settings = db.collection("settings");
    const config = await settings.findOne({ _id: "store-config" });
    
    if (!config) {
      throw createError({
        statusCode: 500,
        message: "Configurações da loja não encontradas",
      });
    }
    
    // Se CEP foi fornecido, usar lógica baseada em CEP
    if (zipCode) {
      const cleanZipCode = zipCode.replace(/\D/g, '');
      
      if (cleanZipCode.length !== 8) {
        throw createError({
          statusCode: 400,
          message: "CEP deve ter 8 dígitos",
        });
      }
      
      // Verificar se o CEP está na lista de restritos
      const restrictedZipCodes = config.restrictedZipCodes || [];
      if (restrictedZipCodes.length > 0) {
        const formattedZipCode = cleanZipCode.substring(0, 5) + '-' + cleanZipCode.substring(5, 8);
        const isRestricted = restrictedZipCodes.some((restricted: string) => {
          const restrictedClean = restricted.replace(/\D/g, '');
          return restrictedClean === cleanZipCode || restricted === formattedZipCode;
        });
        
        if (isRestricted) {
          throw createError({
            statusCode: 403,
            message: "Desculpe, não entregamos neste CEP. Entrega não disponível para esta região.",
          });
        }
      }
      
      // Definir zonas de entrega baseadas em CEP
      const deliveryZones = config.deliveryZones || [];
      const cepPrefix = cleanZipCode.substring(0, 5); // Primeiros 5 dígitos do CEP
      
      
      // Encontrar zona de entrega correspondente ao CEP
      let deliveryFee = null;
      let deliveryZone = null;
      let canDeliver = false;
      
      // Verificar se o CEP está em alguma zona de entrega específica
      for (const zone of deliveryZones) {
        if (zone.cepRanges && zone.cepRanges.some((range: any) => {
          if (range.includes('-')) {
            // Range format: "08570-08580"
            const [start, end] = range.split('-').map((cep: string) => cep.substring(0, 5));
            return cepPrefix >= start && cepPrefix <= end;
          } else {
            // Single prefix format: "08" (2 digits) or "08574" (5 digits)
            const rangePrefix = range.substring(0, Math.min(range.length, cepPrefix.length));
            return cepPrefix.startsWith(rangePrefix);
          }
        })) {
          deliveryFee = zone.fee;
          deliveryZone = zone;
          canDeliver = true;
          break;
        }
      }
      
      // Se não encontrou zona específica, usar zona padrão baseada em distância
      if (!canDeliver) {
        // Para CEPs não mapeados, usar uma lógica inteligente baseada no CEP
        if (deliveryZones.length > 0) {
          // Determinar zona baseada no prefixo do CEP
          // CEPs que começam com 08 são da região metropolitana de São Paulo
          // Usar zona intermediária para esses CEPs
          let selectedZone = deliveryZones[0]; // Zona padrão (mais próxima)
          
          if (cepPrefix.startsWith('08')) {
            // Para região metropolitana, usar zona intermediária se disponível
            if (deliveryZones.length >= 2) {
              selectedZone = deliveryZones[1]; // Segunda zona (intermediária)
            }
          } else if (cepPrefix.startsWith('01') || cepPrefix.startsWith('02') || 
                     cepPrefix.startsWith('03') || cepPrefix.startsWith('04') || 
                     cepPrefix.startsWith('05') || cepPrefix.startsWith('06') || 
                     cepPrefix.startsWith('07')) {
            // Para São Paulo capital, usar zona mais próxima
            selectedZone = deliveryZones[0];
          } else {
            // Para outras regiões muito distantes, não entregar
            return {
              canDeliver: false,
              message: "Desculpe, não entregamos neste CEP",
              zipCode: cleanZipCode
            };
          }
          
          deliveryFee = selectedZone.fee;
          deliveryZone = selectedZone;
          canDeliver = true;
        }
      }
      
      // Se ainda não encontrou zona mas há taxa padrão configurada, usar ela
      if (!canDeliver) {
        if (config.deliveryFee !== undefined) {
          deliveryFee = config.deliveryFee
          canDeliver = true
        } else {
          return {
            canDeliver: false,
            message: "Desculpe, não entregamos neste CEP",
            zipCode: cleanZipCode
          };
        }
      }
      
      const result = {
        canDeliver: true,
        deliveryFee: deliveryFee,
        deliveryZone: deliveryZone?.label || 'Padrão',
        estimatedTime: `${config.deliveryMinTime || 30}-${config.deliveryMaxTime || 45} min`,
        zipCode: cleanZipCode
      };
      
      return result;
    }
    
    // Fallback para coordenadas (mantido para compatibilidade)
    if (latitude !== undefined && longitude !== undefined) {
      if (!config.location) {
        throw createError({
          statusCode: 500,
          message: "Localização da loja não configurada",
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
      
      // Ordenar zonas por distância máxima (menor primeiro) para garantir que pegamos a zona mais próxima
      // Isso garante que uma distância de 1km use a zona de 1km (se existir) e não uma zona maior
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
        estimatedTime: `${config.deliveryMinTime || 30}-${config.deliveryMaxTime || 45} min`
      };
    }
    
    throw createError({
      statusCode: 400,
      message: "CEP ou coordenadas são obrigatórios",
    });
    
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
