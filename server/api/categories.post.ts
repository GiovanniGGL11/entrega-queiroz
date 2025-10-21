// server/api/categories.post.ts
import { getDB } from "../utils/db";
import { requireAuth } from "../utils/auth-middleware";

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  await requireAuth(event);
  
  const body = await readBody(event);
  const { name, description, isVisible = true } = body;

  if (!name || name.trim() === '') {
    throw createError({
      statusCode: 400,
      message: "Nome da categoria é obrigatório",
    });
  }

  try {
    const db = await getDB();
    const categories = db.collection("categories");
    
    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await categories.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      throw createError({
        statusCode: 409,
        message: "Já existe uma categoria com este nome",
      });
    }

    const result = await categories.insertOne({
      name: name.trim(),
      description: description?.trim() || '',
      isVisible: Boolean(isVisible),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return { 
      id: result.insertedId, 
      message: "Categoria criada com sucesso",
      category: {
        _id: result.insertedId,
        name: name.trim(),
        description: description?.trim() || '',
        isVisible: Boolean(isVisible),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao criar categoria" 
    });
  }
});
