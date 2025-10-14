import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  try {
    // Obter token do cookie - tentar ambos os nomes
    let token = getCookie(event, 'auth_token')
    
    // Fallback para authToken (sistema antigo)
    if (!token) {
      token = getCookie(event, 'authToken')
    }
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No token provided'
      })
    }

    // Verificar token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
      
      // Retornar dados do usuário
      return {
        userId: decoded.userId,
        email: decoded.email,
        authenticated: true
      }
    } catch (jwtError) {
      // Token inválido ou expirado
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      })
    }
  } catch (error: any) {
    // Se já é um erro H3, repassar
    if (error.statusCode) {
      throw error
    }
    
    // Erro inesperado
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication error'
    })
  }
})

