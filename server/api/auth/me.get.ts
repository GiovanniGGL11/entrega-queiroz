import { readTokenFromEvent, verifyUserToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 Verificando autenticação (/api/auth/me)')
    
    // Obter token do cookie
    const token = readTokenFromEvent(event)
    
    if (!token) {
      console.log('❌ Nenhum token encontrado nos cookies')
      throw createError({
        statusCode: 401,
        statusMessage: 'No token provided'
      })
    }

    // Verificar token
    try {
      const decoded = verifyUserToken(token)
      console.log('✅ Token válido, usuário:', decoded.email)
      
      // Retornar dados do usuário
      return {
        userId: decoded.userId,
        email: decoded.email,
        authenticated: true
      }
    } catch (jwtError) {
      // Token inválido ou expirado
      console.log('❌ Token inválido ou expirado:', jwtError)
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
    console.error('❌ Erro inesperado na autenticação:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication error'
    })
  }
})

