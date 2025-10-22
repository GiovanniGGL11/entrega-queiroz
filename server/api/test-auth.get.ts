import { getRequestHeader, getCookie } from 'h3'

export default defineEventHandler(async (event) => {
  // Debug logs para produção
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 [TEST AUTH] Endpoint de teste chamado')
    
    // Verificar headers
    const authHeader = getRequestHeader(event, 'authorization')
    console.log('🔍 [TEST AUTH] Authorization header:', authHeader ? 'present' : 'missing')
    
    // Verificar cookies
    const cookies = getCookie(event, 'auth_token')
    console.log('🔍 [TEST AUTH] Auth cookie:', cookies ? 'present' : 'missing')
  }
  
  return {
    success: true,
    message: 'Teste de autenticação funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }
})
