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
      return {
        storeName: "Minha Loja",
        logo: "",
        banner: "",
        isOpen: true,
        deliveryMinTime: 30,
        deliveryMaxTime: 60,
        deliveryFee: 0,
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
    
    // Retornar apenas as configurações públicas necessárias
    return {
      storeName: storeSettings.storeName || "Minha Loja",
      logo: storeSettings.logo || "",
      banner: storeSettings.banner || "",
      isOpen: storeSettings.isOpen !== undefined ? storeSettings.isOpen : true,
      deliveryMinTime: storeSettings.deliveryMinTime || 30,
      deliveryMaxTime: storeSettings.deliveryMaxTime || 60,
      deliveryFee: storeSettings.deliveryFee !== undefined ? storeSettings.deliveryFee : 0,
      minimumOrder: storeSettings.minimumOrder !== undefined ? storeSettings.minimumOrder : 0,
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
    
    // Em caso de erro, retornar valores padrão
    return {
      storeName: "Minha Loja",
      logo: "",
      banner: "",
      isOpen: true,
      deliveryMinTime: 30,
      deliveryMaxTime: 60,
      deliveryFee: 0,
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
