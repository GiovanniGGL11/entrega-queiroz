// server/api/products/[id].put.ts
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
import { verifyUserToken } from "../../utils/auth";
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
  
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const { name, description, price, image, categoryId, complements, order, isVisible } = body;

  if (!id || !ObjectId.isValid(id)) {
    throw createError({
      statusCode: 400,
      message: "ID do produto inválido",
    });
  }

  if (!name || name.trim() === '') {
    throw createError({
      statusCode: 400,
      message: "Nome do produto é obrigatório",
    });
  }

  if (!price || price <= 0) {
    throw createError({
      statusCode: 400,
      message: "Preço deve ser maior que zero",
    });
  }

  if (!categoryId) {
    throw createError({
      statusCode: 400,
      message: "Categoria é obrigatória",
    });
  }

  try {
    const db = await getDB();
    const products = db.collection("products");
    
    // Verificar se o produto existe
    const existingProduct = await products.findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
      throw createError({
        statusCode: 404,
        message: "Produto não encontrado",
      });
    }

    // Verificar se já existe outro produto com o mesmo nome na mesma categoria
    const duplicateProduct = await products.findOne({ 
      _id: { $ne: new ObjectId(id) },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      categoryId: categoryId
    });
    
    if (duplicateProduct) {
      throw createError({
        statusCode: 409,
        message: "Já existe um produto com este nome nesta categoria",
      });
    }

    const result = await products.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: name.trim(),
          description: description?.trim() || '',
          price: parseFloat(price),
          image: image?.trim() || '/not_found.jpg',
          categoryId: categoryId,
          complements: complements || [],
          order: order !== undefined ? parseInt(order) : existingProduct.order,
          isVisible: isVisible !== undefined ? Boolean(isVisible) : existingProduct.isVisible,
          updatedAt: new Date(),
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "Produto não encontrado",
      });
    }
    
    return { 
      message: "Produto atualizado com sucesso",
      product: {
        _id: new ObjectId(id),
        name: name.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        image: image?.trim() || '/not_found.jpg',
        categoryId: categoryId,
        complements: complements || [],
        order: order !== undefined ? parseInt(order) : existingProduct.order,
        isVisible: isVisible !== undefined ? Boolean(isVisible) : existingProduct.isVisible,
        createdAt: existingProduct.createdAt,
        updatedAt: new Date()
      }
    };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    throw createError({ 
      statusCode: 500, 
      message: "Erro ao atualizar produto" 
    });
  }
});
