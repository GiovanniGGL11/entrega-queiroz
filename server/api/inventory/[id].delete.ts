// server/api/inventory/[id].delete.ts
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
import { requireAuth } from "../../utils/auth-middleware";

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  await requireAuth(event);
  
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID do estoque é obrigatório",
    });
  }

  try {
    const db = await getDB();
    const inventory = db.collection("inventory");
    
    const result = await inventory.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "Item de estoque não encontrado",
      });
    }
    
    return { 
      message: "Controle de estoque removido com sucesso"
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao remover controle de estoque" 
    });
  }
});
