import { getRequestHeader, getRequestHeaders } from 'h3'

export default defineEventHandler(async (event) => {
  // Debug completo para Vercel
  const authHeader = getRequestHeader(event, 'authorization')
  const allHeaders = getRequestHeaders(event)
  
  console.log('🔍 [VERCEL DEBUG] Endpoint chamado')
  console.log('🔍 [VERCEL DEBUG] Authorization header:', authHeader)
  console.log('🔍 [VERCEL DEBUG] All headers:', JSON.stringify(allHeaders, null, 2))
  
  return {
    success: true,
    message: 'Debug Vercel',
    timestamp: new Date().toISOString(),
    debug: {
      authorization: authHeader,
      hasAuthHeader: !!authHeader,
      allHeaders: allHeaders,
      environment: process.env.NODE_ENV
    }
  }
})
