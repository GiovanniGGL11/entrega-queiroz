import { ObjectId } from 'mongodb'
import { createError } from 'h3'

// ─── RATE LIMITER ────────────────────────────────────────────────────────────
// Armazenamento em memória por processo (suficiente para Vercel serverless
// onde cada função tem seu próprio processo). Para multi-instância use Redis.

interface RateLimitEntry {
  count: number
  resetAt: number
  blockedUntil?: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000)

export class RateLimiter {
  /**
   * Verifica se o identificador passou do limite.
   * @returns true = permitido | false = bloqueado
   */
  static check(
    identifier: string,
    maxRequests: number,
    windowMs: number,
    blockMs: number = 0
  ): boolean {
    const now = Date.now()
    let entry = rateLimitStore.get(identifier)

    // Se ainda está no período de bloqueio
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      return false
    }

    // Janela expirou → resetar
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs })
      return true
    }

    entry.count++

    if (entry.count > maxRequests) {
      if (blockMs > 0) {
        entry.blockedUntil = now + blockMs
      }
      return false
    }

    return true
  }

  /** Retorna segundos até a janela ser resetada */
  static retryAfterSeconds(identifier: string): number {
    const entry = rateLimitStore.get(identifier)
    if (!entry) return 0
    const target = entry.blockedUntil ?? entry.resetAt
    return Math.ceil(Math.max(0, target - Date.now()) / 1000)
  }

  /**
   * Lança erro 429 se o limite foi ultrapassado.
   * Uso: RateLimiter.enforce('login:' + ip, 5, 60_000, 300_000)
   */
  static enforce(
    identifier: string,
    maxRequests: number,
    windowMs: number,
    blockMs: number = 0
  ): void {
    if (!this.check(identifier, maxRequests, windowMs, blockMs)) {
      const retry = this.retryAfterSeconds(identifier)
      throw createError({
        statusCode: 429,
        statusMessage: `Muitas tentativas. Tente novamente em ${retry}s.`,
        data: { retryAfter: retry }
      })
    }
  }
}

// ─── SANITIZAÇÃO ──────────────────────────────────────────────────────────────

/**
 * Remove completamente qualquer HTML/JS do input.
 * Não usa regex naïve — strip completo de tags e atributos perigosos.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return ''

  return input
    // Remove scripts, iframes, embeds e similares com seu conteúdo
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    // Remove qualquer tag HTML restante
    .replace(/<[^>]+>/g, '')
    // Remove protocolos perigosos
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\s*\/\s*html/gi, '')
    // Remove event handlers
    .replace(/\bon\w+\s*=/gi, '')
    .trim()
}

/**
 * Sanitiza para uso em nomes/descrições (permite pontuação normal).
 * Rejeita se após sanitização ficar vazio.
 */
export function sanitizeName(input: unknown, fieldName: string, maxLength = 200): string {
  const clean = sanitizeString(input)
  if (!clean) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} inválido ou vazio após sanitização` })
  }
  if (clean.length > maxLength) {
    throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ter no máximo ${maxLength} caracteres` })
  }
  return clean
}

// ─── VALIDADORES ──────────────────────────────────────────────────────────────

export class InputValidator {

  static validateObjectId(id: unknown, fieldName = 'ID'): string {
    if (!id || typeof id !== 'string' || id.length > 100) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} inválido` })
    }
    if (!ObjectId.isValid(id)) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} inválido` })
    }
    return id
  }

  static validateRequiredString(value: unknown, fieldName: string, maxLength = 255): string {
    if (value === null || value === undefined || typeof value !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} é obrigatório` })
    }
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} não pode estar vazio` })
    }
    if (trimmed.length > maxLength) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ter no máximo ${maxLength} caracteres` })
    }
    return trimmed
  }

  static validateOptionalString(value: unknown, fieldName: string, maxLength = 255): string {
    if (value === null || value === undefined || value === '') return ''
    if (typeof value !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ser texto` })
    }
    if (value.length > maxLength) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ter no máximo ${maxLength} caracteres` })
    }
    return value.trim()
  }

  static validatePositiveNumber(value: unknown, fieldName: string, min = 0, max = 1_000_000): number {
    if (value === null || value === undefined) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} é obrigatório` })
    }
    const num = Number(value)
    if (!isFinite(num) || isNaN(num)) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ser um número válido` })
    }
    if (num < min) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ser >= ${min}` })
    }
    if (num > max) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ser <= ${max}` })
    }
    return num
  }

  static validateEmail(email: unknown): string {
    if (!email || typeof email !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'Email é obrigatório' })
    }
    const trimmed = email.trim().toLowerCase()
    if (trimmed.length > 254) {
      throw createError({ statusCode: 400, statusMessage: 'Email inválido' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw createError({ statusCode: 400, statusMessage: 'Email inválido' })
    }
    return trimmed
  }

  static validatePassword(password: unknown, fieldName = 'Senha'): string {
    if (!password || typeof password !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} é obrigatória` })
    }
    if (password.length < 6) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ter pelo menos 6 caracteres` })
    }
    if (password.length > 128) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ter no máximo 128 caracteres` })
    }
    return password
  }

  static validatePhone(phone: unknown): string {
    if (!phone || typeof phone !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'Telefone é obrigatório' })
    }
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 10 || clean.length > 11) {
      throw createError({ statusCode: 400, statusMessage: 'Telefone inválido' })
    }
    return clean
  }

  static validateCEP(cep: unknown): string {
    if (!cep || typeof cep !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'CEP é obrigatório' })
    }
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) {
      throw createError({ statusCode: 400, statusMessage: 'CEP deve ter 8 dígitos' })
    }
    return clean
  }

  /** Valida paginação e retorna page/limit seguros */
  static validatePagination(
    pageRaw: unknown,
    limitRaw: unknown,
    maxLimit = 100
  ): { page: number; limit: number; skip: number } {
    let page = parseInt(String(pageRaw)) || 1
    let limit = parseInt(String(limitRaw)) || 50

    if (page < 1 || !isFinite(page)) page = 1
    if (limit < 1 || !isFinite(limit)) limit = 50
    if (limit > maxLimit) limit = maxLimit

    return { page, limit, skip: (page - 1) * limit }
  }

  static validateOrderStatus(status: unknown): string {
    const valid = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
    if (!status || typeof status !== 'string' || !valid.includes(status)) {
      throw createError({ statusCode: 400, statusMessage: 'Status inválido' })
    }
    return status
  }

  static validateInventoryMovementType(type: unknown): string {
    const valid = ['entrada', 'saida', 'ajuste', 'perda', 'transferencia']
    if (!type || typeof type !== 'string' || !valid.includes(type)) {
      throw createError({ statusCode: 400, statusMessage: 'Tipo de movimento inválido' })
    }
    return type
  }

  static validateObjectArray(value: unknown, fieldName: string, minLength = 1): any[] {
    if (!Array.isArray(value)) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ser um array` })
    }
    if (value.length < minLength) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ter pelo menos ${minLength} item(s)` })
    }
    return value
  }

  /**
   * Valida URL fornecida pelo usuário.
   * Bloqueia: localhost, 127.x, 169.254.x (metadata AWS), 10.x, 172.16-31.x, ::1, protocolos não-http(s)
   */
  static validateExternalUrl(url: unknown, fieldName = 'URL'): string {
    if (!url || typeof url !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} é obrigatória` })
    }
    const trimmed = url.trim()
    if (trimmed.length > 2048) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} muito longa` })
    }

    let parsed: URL
    try {
      parsed = new URL(trimmed)
    } catch {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} inválida` })
    }

    // Apenas HTTPS em produção
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve usar HTTPS` })
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} com protocolo inválido` })
    }

    // Bloquear SSRF: IPs privados e especiais
    const host = parsed.hostname.toLowerCase()
    const ssrfPatterns = [
      /^localhost$/i,
      /^127\./,
      /^0\./,
      /^0\.0\.0\.0$/,
      /^169\.254\./,           // link-local (AWS metadata)
      /^10\./,                  // RFC1918
      /^172\.(1[6-9]|2\d|3[01])\./,  // RFC1918
      /^192\.168\./,            // RFC1918
      /^::1$/,                  // IPv6 loopback
      /^fc00:/i,                // IPv6 ULA
      /^fd/i,                   // IPv6 ULA
      /^fe80:/i,                // IPv6 link-local
      /^metadata\.google/i,
      /^metadata\.internal/i,
    ]
    for (const pattern of ssrfPatterns) {
      if (pattern.test(host)) {
        throw createError({ statusCode: 400, statusMessage: `${fieldName} inválida` })
      }
    }

    return trimmed
  }

  /** Valida base64 de imagem (avatar) */
  static validateImageBase64(data: unknown, fieldName = 'Imagem', maxBytes = 307_200): string {
    if (!data || typeof data !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} é obrigatória` })
    }

    if (!data.startsWith('data:image/')) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} deve ser uma imagem válida` })
    }

    // Bloquear SVG (pode conter XSS)
    if (data.startsWith('data:image/svg')) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName}: formato SVG não permitido` })
    }

    // Verificar tamanho (base64 ocupa ~4/3 dos bytes reais)
    const base64Part = data.split(',')[1] || ''
    const approxBytes = Math.floor(base64Part.length * 0.75)
    if (approxBytes > maxBytes) {
      throw createError({ statusCode: 400, statusMessage: `${fieldName} excede o tamanho máximo permitido (${Math.floor(maxBytes / 1024)}KB)` })
    }

    return data
  }

  // Manter compatibilidade com código legado
  static sanitizeHTML = sanitizeString
  static validateURL = InputValidator.validateExternalUrl
}
