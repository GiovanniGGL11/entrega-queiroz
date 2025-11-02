// Utilitário para gerenciar conexões SSE e notificações

// Armazenar conexões globalmente
if (typeof global !== 'undefined') {
  if (!global.orderNotifications) {
    global.orderNotifications = []
  }
} else {
  if (typeof globalThis.orderNotifications === 'undefined') {
    globalThis.orderNotifications = []
  }
}

// Função para notificar todos os clientes conectados sobre novo pedido
export const notifyNewOrder = async (order) => {
  const clients = global?.orderNotifications || globalThis.orderNotifications
  
  if (!clients || clients.length === 0) {
    console.log('[SSE] Nenhum cliente conectado para notificar')
    return
  }

  const notification = {
    type: 'new_order',
    order: order
  }

  console.log(`[SSE] Notificando ${clients.length} cliente(s) sobre novo pedido: ${order.orderNumber}`)

  // Enviar para todos os clientes conectados
  const failedClients = []
  clients.forEach((client, index) => {
    try {
      client.send(notification)
    } catch (error) {
      console.error(`[SSE] Erro ao notificar cliente ${client.id}:`, error)
      failedClients.push(index)
    }
  })

  // Remover clientes que falharam
  if (failedClients.length > 0) {
    failedClients.reverse().forEach(idx => {
      clients.splice(idx, 1)
    })
  }

  console.log(`[SSE] Notificação enviada com sucesso para ${clients.length - failedClients.length} cliente(s)`)
}

// Função para obter lista de clientes (para debug)
export const getConnectedClients = () => {
  const clients = global?.orderNotifications || globalThis.orderNotifications
  return clients?.length || 0
}

