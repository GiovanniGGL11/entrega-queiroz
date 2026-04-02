import { readTokenFromEvent, verifyUserToken } from './auth'
import { createError, getRequestHeader } from 'h3'

export async function requireAuth(event: any) {
  try {
    // Debug logs para produção
    if (process.env.NODE_ENV === 'production') {
    }
    
    // Obter token do cookie ou header Authorization
    let token = readTokenFromEvent(event)
    
    if (process.env.NODE_ENV === 'production') {
    }
    
    // Fallback: tentar obter do header Authorization
    if (!token) {
      const authHeader = getRequestHeader(event, 'authorization')
      if (process.env.NODE_ENV === 'production') {
      }
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
        if (process.env.NODE_ENV === 'production') {
        }
      }
    }
    
    if (!token) {
      if (process.env.NODE_ENV === 'production') {
      }
      throw createError({
        statusCode: 401,
        statusMessage: 'Token de autenticação necessário'
      })
    }

    // Verificar token
    try {
      const decoded = verifyUserToken(token)
      return decoded
    } catch (jwtError) {
      // Token inválido ou expirado
      throw createError({
        statusCode: 401,
        statusMessage: 'Token inválido ou expirado'
      })
    }
  } catch (error: any) {
    // Se já é um erro H3, repassar
    if (error.statusCode) {
      throw error
    }
    
    // Erro inesperado
    console.error('Erro na verificação de autenticação:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro de autenticação'
    })
  }
}

export function createAuthMiddleware(handler: Function) {
  return async (event: any) => {
    // Verificar autenticação antes de executar o handler
    await requireAuth(event)
    
    // Se chegou até aqui, usuário está autenticado
    return handler(event)
  }
}
