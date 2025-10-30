// server/api/public/settings.get.ts
import { getDB } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const db = await getDB();
    const settings = db.collection("settings");
    
    // Buscar configurações da loja
    let storeSettings = await settings.findOne({});
    
    // Se não existir configurações, retornar valores padrão
    if (!storeSettings) {
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
    return {
      storeName: storeSettings.storeName || "Minha Loja",
      logo: storeSettings.logo || "",
      banner: storeSettings.banner || "",
      isOpen: isOpen,
      deliveryMinTime: storeSettings.deliveryMinTime || 30,
      deliveryMaxTime: storeSettings.deliveryMaxTime || 60,
      deliveryFee: storeSettings.deliveryFee !== undefined ? storeSettings.deliveryFee : 0,
      minimumOrder: storeSettings.minimumOrder !== undefined ? storeSettings.minimumOrder : 0,
      storeAddress: storeSettings.location?.address || "",
      storePhone: storeSettings.storePhone || "",
      whatsapp: storeSettings.whatsapp || "",
      storeLatitude: storeSettings.location?.latitude || -23.5505,
      storeLongitude: storeSettings.location?.longitude || -46.6333,
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
      deliveryZones: storeSettings.deliveryZones || [
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
  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    
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
