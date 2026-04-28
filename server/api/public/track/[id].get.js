// SSE público para rastreamento de pedido pelo cliente
// Não exige autenticação — acessível pelo link de rastreamento
import { setHeader, getRouterParam } from 'h3'
import { addOrderTracker, removeOrderTracker } from '../../../utils/sse-notifications'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'ID do pedido necessário' })
  }

  // Headers SSE
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')
  setHeader(event, 'Access-Control-Allow-Origin', '*')

  const stream = event.node.res

  // Mensagem de conexão
  stream.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  const clientId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)

  const sendEvent = (data) => {
    try {
      stream.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch {}
  }

  addOrderTracker(orderId, { id: clientId, send: sendEvent })

  const cleanup = () => removeOrderTracker(orderId, clientId)

  // Ping a cada 25s para manter conexão viva
  const pingInterval = setInterval(() => {
    try {
      if (stream && !stream.destroyed && !stream.closed) {
        stream.write(`: ping\n\n`)
      } else {
        cleanup()
        clearInterval(pingInterval)
      }
    } catch {
      cleanup()
      clearInterval(pingInterval)
    }
  }, 25000)

  event.node.req.on('close', () => {
    cleanup()
    clearInterval(pingInterval)
  })

  event.node.req.on('error', () => {
    cleanup()
    clearInterval(pingInterval)
  })

  return new Promise(() => {})
})
