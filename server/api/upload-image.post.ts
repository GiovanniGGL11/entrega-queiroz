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
  
  try {
    const body = await readBody(event);
    const { image, filename, type } = body;
    
    if (!image) {
      throw createError({
        statusCode: 400,
        message: "Imagem é obrigatória",
      });
    }
    
    // Validar se é base64 ou URL
    let imageData = image;
    
    // Se for uma URL de dados (data:image/...)
    if (image.startsWith('data:image/')) {
      // Validar tamanho (máx 5MB para base64)
      const base64Length = image.length - image.indexOf(',') - 1;
      const sizeInBytes = (base64Length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 5) {
        throw createError({
          statusCode: 400,
          message: "Imagem muito grande. Máximo 5MB",
        });
      }
      
      imageData = image;
    }
    
    const db = await getDB();
    const images = db.collection("images");
    
    // Salvar imagem no MongoDB
    const result = await images.insertOne({
      filename: filename || `image-${Date.now()}`,
      type: type || 'general',
      data: imageData,
      createdAt: new Date(),
    });
    
    return {
      message: "Imagem salva com sucesso",
      imageId: result.insertedId,
      imageUrl: imageData // Retorna a base64 ou URL para uso imediato
    };
  } catch (err: any) {
    if (err.statusCode) {
      throw err;
    }
    console.error("Erro ao fazer upload:", err);
    throw createError({
      statusCode: 500,
      message: "Erro ao fazer upload da imagem",
    });
  }
});


