// server/api/categories/[id].put.ts
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { name, description, order } = body;

  if (!ObjectId.isValid(id)) {
    throw createError({
      statusCode: 400,
      message: "ID da categoria inválido",
    });
  }

  // Se name não foi fornecido, é uma atualização apenas de ordem
  if (name !== undefined && (!name || name.trim() === '')) {
    throw createError({
      statusCode: 400,
      message: "Nome da categoria é obrigatório",
    });
  }

  try {
    const db = await getDB();
    const categories = db.collection("categories");
    
    // Verificar se a categoria existe
    const existingCategory = await categories.findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      throw createError({
        statusCode: 404,
        message: "Categoria não encontrada",
      });
    }

    // Verificar se já existe outra categoria com o mesmo nome (apenas se name foi fornecido)
    if (name !== undefined) {
      const duplicateCategory = await categories.findOne({ 
        _id: { $ne: new ObjectId(id) },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
      });
      
      if (duplicateCategory) {
        throw createError({
          statusCode: 409,
          message: "Já existe uma categoria com este nome",
        });
      }
    }

    // Construir objeto de atualização dinamicamente
    const updateFields = {
      updatedAt: new Date(),
    };
    
    if (name !== undefined) {
      updateFields.name = name.trim();
    }
    
    if (description !== undefined) {
      updateFields.description = description.trim() || '';
    }
    
    if (order !== undefined) {
      updateFields.order = parseInt(order);
    }

    const result = await categories.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "Categoria não encontrada",
      });
    }
    
    // Buscar a categoria atualizada
    const updatedCategory = await categories.findOne({ _id: new ObjectId(id) });
    
    return { 
      message: "Categoria atualizada com sucesso",
      category: updatedCategory
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao atualizar categoria" 
    });
  }
});
