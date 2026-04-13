/**
 * Utilitário de notificações via WhatsApp (Evolution API)
 *
 * Para ativar:
 * 1. Configure as variáveis de ambiente:
 *    WHATSAPP_ENABLED=true
 *    EVOLUTION_API_URL=https://sua-instancia.up.railway.app
 *    EVOLUTION_API_KEY=sua_chave_aqui
 *    EVOLUTION_INSTANCE=nome_da_instancia
 * 2. Conecte o WhatsApp da hamburgueria na instância da Evolution API
 *
 * Enquanto WHATSAPP_ENABLED não for "true", as funções retornam silenciosamente.
 */

function getConfig() {
  return {
    enabled: process.env.WHATSAPP_ENABLED === 'true',
    url: process.env.EVOLUTION_API_URL || '',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instance: process.env.EVOLUTION_INSTANCE || '',
  }
}

/**
 * Normaliza o número de telefone para o formato internacional (55XXXXXXXXXXX)
 */
function normalizePhone(phone: string): string {
  // Remove tudo que não for número
  const digits = phone.replace(/\D/g, '')

  // Se já começa com 55 e tem 12-13 dígitos, está ok
  if (digits.startsWith('55') && digits.length >= 12) return digits

  // Adicionar código do Brasil
  return `55${digits}`
}

/**
 * Envia uma mensagem de texto via Evolution API
 */
async function sendMessage(phone: string, message: string): Promise<boolean> {
  const config = getConfig()
  if (!config.enabled || !config.url || !config.apiKey || !config.instance) return false

  const number = normalizePhone(phone)

  try {
    const res = await fetch(`${config.url}/message/sendText/${config.instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
      },
      body: JSON.stringify({
        number,
        text: message,
      }),
    })

    if (!res.ok) {
      console.error('[WhatsApp] Erro ao enviar mensagem:', res.status, await res.text())
      return false
    }

    console.log(`[WhatsApp] Mensagem enviada para ${number}`)
    return true
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', err)
    return false
  }
}

/**
 * Mensagens por status — personalize à vontade
 */
function buildStatusMessage(order: any, newStatus: string): string | null {
  const name = order.customerInfo?.name?.split(' ')[0] || 'Cliente'
  const orderNum = order.orderNumber || order._id?.toString()?.slice(-6)
  const total = order.totalAmount ? `R$ ${Number(order.totalAmount).toFixed(2).replace('.', ',')}` : ''
  const isBalcao = order.type === 'balcao'
  const isRetirada = order.type === 'retirada'

  switch (newStatus) {
    case 'confirmed':
      return `✅ Olá, *${name}*! Seu pedido *#${orderNum}* foi *confirmado* pela Queiroz Hamburgueria. Em breve começaremos a preparar! 🍔`

    case 'preparing':
      return `👨‍🍳 *${name}*, seu pedido *#${orderNum}* está sendo *preparado* agora! Aguarde, já já fica pronto. 🔥`

    case 'ready':
      if (isBalcao) return null // balcão não envia — cliente está no local
      if (isRetirada) return `🏠 *${name}*, seu pedido *#${orderNum}* está *pronto para retirada*! Pode vir buscar na loja. 🛍️`
      return `✅ *${name}*, seu pedido *#${orderNum}* está *pronto* e saindo agora para entrega! 🛵`

    case 'out_for_delivery':
      const motoboy = order.motoboyNome ? ` com *${order.motoboyNome}*` : ''
      return `🛵 *${name}*, seu pedido *#${orderNum}* saiu para entrega${motoboy}! Fique de olho, está chegando! 🍔`

    case 'delivered':
      if (isBalcao || isRetirada) return null // presencial, não precisa avisar
      return `🎉 *${name}*, seu pedido *#${orderNum}* (${total}) foi *entregue*! Esperamos que aproveite. Obrigado pela preferência! ❤️`

    case 'cancelled':
      return `❌ *${name}*, infelizmente seu pedido *#${orderNum}* foi *cancelado*. Entre em contato conosco para mais informações.`

    default:
      return null
  }
}

/**
 * Notifica o cliente sobre a mudança de status do pedido.
 * Chamada automaticamente pelo endpoint de atualização de status.
 */
export async function notifyOrderStatus(order: any, newStatus: string): Promise<void> {
  const config = getConfig()

  console.log(`[WhatsApp] Status: ${newStatus} | Enabled: ${config.enabled} | Phone: ${order.customerInfo?.phone || 'N/A'}`)

  if (!config.enabled) {
    console.log('[WhatsApp] Desativado — defina WHATSAPP_ENABLED=true no Vercel')
    return
  }

  const phone = order.customerInfo?.phone
  if (!phone || phone.trim() === '') {
    console.log('[WhatsApp] Sem telefone no pedido, pulando notificação')
    return
  }

  const message = buildStatusMessage(order, newStatus)
  if (!message) {
    console.log(`[WhatsApp] Sem mensagem para status "${newStatus}" (tipo: ${order.type})`)
    return
  }

  await sendMessage(phone, message)
}
