// Utilitário para gerenciar conexões SSE e notificações

// Armazenar conexões globalmente
if (typeof global !== 'undefined') {
  if (!global.orderNotifications) {
    global.orderNotifications = []
  }
  // Map orderId → array de clientes públicos de rastreamento
  if (!global.orderTrackers) {
    global.orderTrackers = {}
  }
} else {
  if (typeof globalThis.orderNotifications === 'undefined') {
    globalThis.orderNotifications = []
  }
  if (typeof globalThis.orderTrackers === 'undefined') {
    globalThis.orderTrackers = {}
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

// Função para notificar mudança de status de pedido
export const notifyStatusChange = async (orderId, orderNumber, newStatus) => {
  // Notificar dashboard (clientes admin)
  const clients = global?.orderNotifications || globalThis.orderNotifications
  if (clients && clients.length > 0) {
    const notification = {
      type: 'status_change',
      orderId,
      orderNumber,
      status: newStatus
    }
    const failedClients = []
    clients.forEach((client, index) => {
      try { client.send(notification) } catch { failedClients.push(index) }
    })
    failedClients.reverse().forEach(idx => clients.splice(idx, 1))
  }

  // Notificar rastreadores públicos do pedido específico
  const trackers = global?.orderTrackers || globalThis.orderTrackers
  const orderClients = trackers[orderId]
  if (orderClients && orderClients.length > 0) {
    const payload = { type: 'status_change', status: newStatus, orderNumber }
    const failed = []
    orderClients.forEach((client, index) => {
      try { client.send(payload) } catch { failed.push(index) }
    })
    failed.reverse().forEach(idx => orderClients.splice(idx, 1))
    console.log(`[SSE-Track] Status ${newStatus} enviado para ${orderClients.length} rastreador(es) do pedido ${orderNumber}`)
  }
}

// Adicionar cliente rastreador para um pedido específico
export const addOrderTracker = (orderId, client) => {
  const trackers = global?.orderTrackers || globalThis.orderTrackers
  if (!trackers[orderId]) {
    trackers[orderId] = []
  }
  trackers[orderId].push(client)
  console.log(`[SSE-Track] Rastreador ${client.id} adicionado ao pedido ${orderId}. Total: ${trackers[orderId].length}`)
}

// Remover cliente rastreador de um pedido específico
export const removeOrderTracker = (orderId, clientId) => {
  const trackers = global?.orderTrackers || globalThis.orderTrackers
  if (trackers[orderId]) {
    const idx = trackers[orderId].findIndex(c => c.id === clientId)
    if (idx !== -1) {
      trackers[orderId].splice(idx, 1)
      console.log(`[SSE-Track] Rastreador ${clientId} removido do pedido ${orderId}. Total: ${trackers[orderId].length}`)
    }
    // Limpar entrada vazia
    if (trackers[orderId].length === 0) {
      delete trackers[orderId]
    }
  }
}

// Função para obter lista de clientes (para debug)
export const getConnectedClients = () => {
  const clients = global?.orderNotifications || globalThis.orderNotifications
  return clients?.length || 0
}
