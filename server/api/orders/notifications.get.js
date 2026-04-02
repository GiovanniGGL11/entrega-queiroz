// Server-Sent Events para notificações de pedidos em tempo real
// ATENÇÃO: Apenas para administradores autenticados no dashboard
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, getQuery, createError, setHeader } from 'h3';

// Garantir que o array de clientes existe (já inicializado no utils/sse-notifications.js)
if (typeof global !== 'undefined') {
  if (!global.orderNotifications) {
    global.orderNotifications = []
  }
} else {
  if (typeof globalThis.orderNotifications === 'undefined') {
    globalThis.orderNotifications = []
  }
}

export default defineEventHandler(async (event) => {
  // Configurar headers para SSE
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Credentials', 'true')

  // Autenticação - verificar token no query param
  const query = getQuery(event)
  let token = query.token
  
  // Fallback para header Authorization se disponível
  if (!token) {
    const authHeader = getRequestHeader(event, 'authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token de autenticação necessário'
    })
  }
  
  // Verificar token (apenas administradores autenticados)
  try {
    verifyUserToken(token)
  } catch (jwtError) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido ou expirado. Apenas administradores podem receber notificações.'
    })
  }

  // Criar stream de resposta
  const stream = event.node.res

  // Enviar mensagem inicial
  stream.write(`data: ${JSON.stringify({ type: 'connected', message: 'Conectado ao servidor de notificações' })}\n\n`)

  const clientId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)
  const clients = global?.orderNotifications || globalThis.orderNotifications
  
  // Função para enviar evento ao cliente
  const sendEvent = (data) => {
    try {
      stream.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      console.error('[SSE] Erro ao enviar evento:', error)
    }
  }

  // Adicionar cliente à lista
  clients.push({ id: clientId, send: sendEvent })
  console.log(`[SSE] Cliente conectado: ${clientId}. Total de clientes: ${clients.length}`)

  // Função de limpeza
  const cleanup = () => {
    const clientList = global?.orderNotifications || globalThis.orderNotifications
    if (clientList) {
      const idx = clientList.findIndex(c => c.id === clientId)
      if (idx !== -1) {
        clientList.splice(idx, 1)
        console.log(`[SSE] Cliente desconectado: ${clientId}. Total de clientes: ${clientList.length}`)
      }
    }
  }

  // Enviar ping a cada 30 segundos para manter conexão viva
  const pingInterval = setInterval(() => {
    try {
      if (stream && !stream.destroyed && !stream.closed) {
        stream.write(`: ping\n\n`)
      } else {
        cleanup()
        clearInterval(pingInterval)
      }
    } catch (error) {
      console.error('[SSE] Erro ao enviar ping:', error)
      cleanup()
      clearInterval(pingInterval)
    }
  }, 30000)

  // Função de limpeza completa
  const fullCleanup = () => {
    cleanup()
    if (pingInterval) {
      clearInterval(pingInterval)
    }
  }

  // Limpar quando conexão for fechada
  event.node.req.on('close', () => {
    console.log(`[SSE] Conexão fechada pelo cliente: ${clientId}`)
    fullCleanup()
  })

  event.node.req.on('error', (error) => {
    console.error(`[SSE] Erro na requisição do cliente ${clientId}:`, error)
    fullCleanup()
  })

  // Tratamento de erros no stream
  stream.on('error', (error) => {
    console.error(`[SSE] Erro no stream do cliente ${clientId}:`, error)
    fullCleanup()
  })

  // Manter conexão aberta
  return new Promise(() => {
    // Conexão permanece aberta indefinidamente até ser fechada pelo cliente ou erro
  })
})

