import { getRequestHeader, getCookie } from 'h3'

export default defineEventHandler(async (event) => {
  // Debug logs para produção
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 [TEST AUTH] Endpoint de teste chamado')
    
    // Verificar headers
    const authHeader = getRequestHeader(event, 'authorization')
    console.log('🔍 [TEST AUTH] Authorization header:', authHeader ? 'present' : 'missing')
    if (authHeader) {
      console.log('🔍 [TEST AUTH] Authorization header value:', authHeader)
    }
    
    // Verificar cookies
    const cookies = getCookie(event, 'auth_token')
    console.log('🔍 [TEST AUTH] Auth cookie:', cookies ? 'present' : 'missing')
    
    // Verificar todos os headers
    const allHeaders = getRequestHeaders(event)
    console.log('🔍 [TEST AUTH] All headers:', Object.keys(allHeaders))
    
    // Verificar se o token está sendo enviado corretamente
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('🔍 [TEST AUTH] Token extraído:', token ? 'present' : 'missing')
      console.log('🔍 [TEST AUTH] Token length:', token ? token.length : 0)
    }
  }
  
  return {
    success: true,
    message: 'Teste de autenticação funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    headers: {
      authorization: getRequestHeader(event, 'authorization') ? 'present' : 'missing',
      cookie: getCookie(event, 'auth_token') ? 'present' : 'missing'
    }
  }
})
