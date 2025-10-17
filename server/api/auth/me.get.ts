import { readTokenFromEvent, verifyUserToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 Verificando autenticação (/api/auth/me)')
    
    // Log dos headers para debug
    const headers = getHeaders(event)
    console.log('📋 Headers recebidos:', {
      cookie: headers.cookie ? 'presente' : 'ausente',
      host: headers.host,
      userAgent: headers['user-agent']?.substring(0, 50) + '...'
    })
    
    // Obter token do cookie ou header Authorization
    let token = readTokenFromEvent(event)
    
    // Fallback: tentar obter do header Authorization
    if (!token) {
      const authHeader = getRequestHeader(event, 'authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
        console.log('🔑 Token obtido do header Authorization')
      }
    }
    
    if (!token) {
      console.log('❌ Nenhum token encontrado nos cookies nem no header')
      throw createError({
        statusCode: 401,
        statusMessage: 'No token provided'
      })
    }

    console.log('🔑 Token encontrado:', token.substring(0, 20) + '...')

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

