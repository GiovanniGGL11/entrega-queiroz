import { getRequestHeader, getCookie, getRequestHeaders } from 'h3'
import { readTokenFromEvent, verifyUserToken } from '../utils/auth'
import { getDB } from '../utils/db'

export default defineEventHandler(async (event) => {
  // Debug logs para produção
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 [MANUAL AUTH] Endpoint de autenticação manual chamado')
    
    // Verificar headers
    const authHeader = getRequestHeader(event, 'authorization')
    console.log('🔍 [MANUAL AUTH] Authorization header:', authHeader ? 'present' : 'missing')
    if (authHeader) {
      console.log('🔍 [MANUAL AUTH] Authorization header value:', authHeader)
    }
    
    // Verificar cookies
    const cookies = getCookie(event, 'auth_token')
    console.log('🔍 [MANUAL AUTH] Auth cookie:', cookies ? 'present' : 'missing')
    
    // Verificar todos os headers
    const allHeaders = getRequestHeaders(event)
    console.log('🔍 [MANUAL AUTH] All headers:', Object.keys(allHeaders))
    
    // Tentar obter token usando a mesma lógica do middleware
    let token = readTokenFromEvent(event)
    console.log('🔍 [MANUAL AUTH] Token do cookie:', token ? 'present' : 'missing')
    
    // Fallback: tentar obter do header Authorization
    if (!token) {
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
        console.log('🔍 [MANUAL AUTH] Token extraído do header:', token ? 'present' : 'missing')
        console.log('🔍 [MANUAL AUTH] Token length:', token ? token.length : 0)
      }
    }
    
    if (!token) {
      console.log('❌ [MANUAL AUTH] Nenhum token encontrado')
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
      console.log('✅ [MANUAL AUTH] Token válido, usuário:', decoded.userId)
      
      // Se chegou até aqui, buscar dados do dashboard
      const db = await getDB()
      const orders = await db.collection("orders").find({}).toArray()
      const products = await db.collection("products").find({}).toArray()
      
      const totalOrders = orders.length
      const pendingOrders = orders.filter(order => order.status === 'pending').length
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      
      return {
        success: true,
        message: 'Autenticação manual bem-sucedida',
        user: decoded,
        stats: {
          totalOrders,
          pendingOrders,
          totalRevenue,
          totalProducts: products.length
        },
        debug: {
          authHeader: authHeader ? 'present' : 'missing',
          cookie: cookies ? 'present' : 'missing',
          tokenSource: authHeader ? 'header' : 'cookie'
        }
      }
    } catch (jwtError) {
      console.log('❌ [MANUAL AUTH] Token inválido:', jwtError.message)
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
    message: 'Teste de autenticação manual funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }
})
