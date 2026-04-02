import { readTokenFromEvent, verifyUserToken } from '../../utils/auth'
import { getRequestHeader } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Obter token do cookie ou header Authorization
    let token = readTokenFromEvent(event)
    
    // Log para debug em produção
    if (process.env.NODE_ENV === 'production') {
      // Debug info removido para produção
    }
    
    // Fallback: tentar obter do header Authorization
    if (!token) {
      const authHeader = getRequestHeader(event, 'authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No token provided'
      })
    }

    // Verificar token
    try {
      const decoded = verifyUserToken(token)
      
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
    console.error('Erro inesperado na autenticação:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication error'
    })
  }
})

