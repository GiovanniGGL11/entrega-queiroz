// server/api/products.post.ts
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
  
  const body = await readBody(event);
  const { name, description, price, image, categoryId, complements, order = 0, isVisible = true, promotion = null } = body;

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
    
    // Verificar se já existe um produto com o mesmo nome na mesma categoria
    const existingProduct = await products.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      categoryId: categoryId
    });
    
    if (existingProduct) {
      throw createError({
        statusCode: 409,
        message: "Já existe um produto com este nome nesta categoria",
      });
    }

    const result = await products.insertOne({
      name: name.trim(),
      description: description?.trim() || '',
      price: parseFloat(price),
      image: image?.trim() || '/not_found.jpg',
      categoryId: categoryId,
      complements: complements || [],
      order: parseInt(order) || 0,
      isVisible: Boolean(isVisible),
      promotion: promotion || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return { 
      id: result.insertedId, 
      message: "Produto criado com sucesso",
      product: {
        _id: result.insertedId,
        name: name.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        image: image?.trim() || '/not_found.jpg',
        categoryId: categoryId,
        complements: complements || [],
        order: parseInt(order) || 0,
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
      message: "Erro ao criar produto" 
    });
  }
});
