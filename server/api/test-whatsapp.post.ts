// server/api/test-whatsapp.post.ts
// Endpoint temporário para diagnosticar WhatsApp — remover após confirmar funcionamento

import { getRequestHeader, createError } from 'h3'
import { verifyUserToken } from '../utils/auth'

export default defineEventHandler(async (event) => {
  // Requer autenticação
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) throw createError({ statusCode: 401 })
  try { verifyUserToken(authHeader.substring(7)) } catch { throw createError({ statusCode: 401 }) }

  const body = await readBody(event)
  const phone = body?.phone || ''

  const config = {
    enabled: process.env.WHATSAPP_ENABLED,
    url: process.env.EVOLUTION_API_URL ? '✅ definida' : '❌ ausente',
    apiKey: process.env.EVOLUTION_API_KEY ? '✅ definida' : '❌ ausente',
    instance: process.env.EVOLUTION_INSTANCE || '❌ ausente',
  }

  if (!phone) {
    return { config, error: 'Informe phone no body' }
  }

  // Normalizar número
  const digits = phone.replace(/\D/g, '')
  const number = digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`

  // Tentar enviar
  try {
    const url = process.env.EVOLUTION_API_URL
    const apiKey = process.env.EVOLUTION_API_KEY
    const instance = process.env.EVOLUTION_INSTANCE

    if (!url || !apiKey || !instance) {
      return { config, error: 'Variáveis de ambiente faltando' }
    }

    const res = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ number, text: '✅ Teste WhatsApp — Queiroz Hamburgueria funcionando!' }),
    })

    const responseText = await res.text()
    return {
      config,
      number,
      statusCode: res.status,
      ok: res.ok,
      response: responseText.slice(0, 500),
    }
  } catch (err: any) {
    return { config, number, error: err?.message || String(err) }
  }
})
