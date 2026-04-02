import { getRequestHeader, getCookie, getRequestHeaders } from 'h3'
import { readTokenFromEvent, verifyUserToken } from '../utils/auth'

export default defineEventHandler(async (event) => {
  // Debug logs para produção
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 [DASHBOARD TEST] Endpoint de teste do dashboard chamado')
    
    // Verificar headers
    const authHeader = getRequestHeader(event, 'authorization')
    console.log('🔍 [DASHBOARD TEST] Authorization header:', authHeader ? 'present' : 'missing')
    if (authHeader) {
      console.log('🔍 [DASHBOARD TEST] Authorization header value:', authHeader)
    }
    
    // Verificar cookies
    const cookies = getCookie(event, 'auth_token')
    console.log('🔍 [DASHBOARD TEST] Auth cookie:', cookies ? 'present' : 'missing')
    
    // Verificar todos os headers
    const allHeaders = getRequestHeaders(event)
    console.log('🔍 [DASHBOARD TEST] All headers:', Object.keys(allHeaders))
    
    // Tentar obter token usando a mesma lógica do middleware
    let token = readTokenFromEvent(event)
    console.log('🔍 [DASHBOARD TEST] Token do cookie:', token ? 'present' : 'missing')
    
    // Fallback: tentar obter do header Authorization
    if (!token) {
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
        console.log('🔍 [DASHBOARD TEST] Token extraído do header:', token ? 'present' : 'missing')
        console.log('🔍 [DASHBOARD TEST] Token length:', token ? token.length : 0)
      }
    }
    
    if (!token) {
      console.log('❌ [DASHBOARD TEST] Nenhum token encontrado')
      return {
        success: false,
        message: 'Nenhum token encontrado',
        debug: {
          authHeader: authHeader ? 'present' : 'missing',
          cookie: cookies ? 'present' : 'missing',
          allHeaders: Object.keys(allHeaders)
        }
      }
    }
    
    // Tentar verificar o token
    try {
      const decoded = verifyUserToken(token)
      console.log('✅ [DASHBOARD TEST] Token válido, usuário:', decoded.userId)
      return {
        success: true,
        message: 'Token válido',
        user: decoded,
        debug: {
          authHeader: authHeader ? 'present' : 'missing',
          cookie: cookies ? 'present' : 'missing',
          tokenSource: authHeader ? 'header' : 'cookie'
        }
      }
    } catch (jwtError) {
      console.log('❌ [DASHBOARD TEST] Token inválido:', jwtError.message)
      return {
        success: false,
        message: 'Token inválido',
        error: jwtError.message,
        debug: {
          authHeader: authHeader ? 'present' : 'missing',
          cookie: cookies ? 'present' : 'missing',
          tokenLength: token ? token.length : 0
        }
      }
    }
  }
  
  return {
    success: true,
    message: 'Teste do dashboard funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }
})
