// server/api/orders/[id].notify.post.ts
// Envia notificação WhatsApp ao cliente quando o status do pedido muda.
// Requer Evolution API configurada nas settings da loja.
import { getDB } from "../../utils/db";
import { ObjectId } from "mongodb";
import { verifyUserToken } from "../../utils/auth";
import { getRequestHeader, createError } from 'h3';

const STATUS_MESSAGES: Record<string, string> = {
  confirmed:        '✅ Seu pedido #{id} foi confirmado! Já estamos preparando com carinho.',
  preparing:        '👨‍🍳 Seu pedido #{id} está sendo preparado agora!',
  ready:            '🎉 Seu pedido #{id} está pronto! Em breve sairá para entrega.',
  out_for_delivery: '🛵 Seu pedido #{id} saiu para entrega! Aguarde na portinha.',
  delivered:        '✅ Pedido #{id} entregue! Obrigado pela preferência. 😊',
  cancelled:        '❌ Seu pedido #{id} foi cancelado. Entre em contato conosco se tiver dúvidas.'
}

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  const authHeader = getRequestHeader(event, 'authorization')
  let token: string | null = null
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Token necessário' })

  try {
    verifyUserToken(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Token inválido' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
  }

  const body = await readBody(event)
  const { status } = body

  if (!status || !STATUS_MESSAGES[status]) {
    // Status sem mensagem configurada — não notificar, mas responder OK
    return { sent: false, reason: 'no_message_for_status' }
  }

  const db = await getDB()

  // Buscar pedido
  const order = await db.collection('orders').findOne({ _id: new ObjectId(id) })
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' })
  }

  // Buscar configurações da loja (WhatsApp API)
  const settings = await db.collection('settings').findOne({})
  if (!settings?.whatsappApiUrl || !settings?.whatsappApiToken || !settings?.whatsappInstanceName) {
    return { sent: false, reason: 'whatsapp_api_not_configured' }
  }

  if (!settings.whatsappNotificationsEnabled) {
    return { sent: false, reason: 'notifications_disabled' }
  }

  // Obter número do cliente (pode estar em customerInfo.phone ou phone)
  const phone = (order.customerInfo?.phone || order.phone || '').replace(/\D/g, '')
  if (!phone || phone.length < 10) {
    return { sent: false, reason: 'no_phone_number' }
  }

  // Formatar número (garantir código do Brasil)
  const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`

  // Montar mensagem
  const orderId = order.orderNumber ? `#${order.orderNumber}` : `#${String(order._id).slice(-6)}`
  const storeName = settings.storeName || 'Delivery'
  const customerName = order.customerInfo?.name || order.customer || ''
  const greeting = customerName ? `Olá, ${customerName.split(' ')[0]}! ` : 'Olá! '
  const statusText = STATUS_MESSAGES[status].replace('{id}', orderId)
  const message = `*${storeName}*\n\n${greeting}${statusText}`

  // Enviar via Evolution API
  try {
    const apiUrl = settings.whatsappApiUrl.replace(/\/$/, '')
    const instanceName = settings.whatsappInstanceName

    await $fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': settings.whatsappApiToken
      },
      body: {
        number: formattedPhone,
        text: message
      }
    })

    // Registrar envio no pedido
    await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $push: { whatsappNotifications: { status, sentAt: new Date(), phone: formattedPhone } } as any }
    )

    return { sent: true, phone: formattedPhone }
  } catch (err: any) {
    console.error('[notify] Erro ao enviar WhatsApp:', err?.message)
    return { sent: false, reason: 'api_error', error: err?.message }
  }
})
