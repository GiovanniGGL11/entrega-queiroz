import { ObjectId } from 'mongodb'

// Validação de entrada para prevenir ataques
export class InputValidator {
  
  // Validar ObjectId
  static validateObjectId(id: string, fieldName: string = 'ID'): string {
    if (!id || typeof id !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} é obrigatório`
      })
    }
    
    if (!ObjectId.isValid(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} inválido`
      })
    }
    
    return id
  }
  
  // Validar string obrigatória
  static validateRequiredString(value: any, fieldName: string, maxLength: number = 255): string {
    if (!value || typeof value !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} é obrigatório`
      })
    }
    
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} não pode estar vazio`
      })
    }
    
    if (trimmed.length > maxLength) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} deve ter no máximo ${maxLength} caracteres`
      })
    }
    
    return trimmed
  }
  
  // Validar número positivo
  static validatePositiveNumber(value: any, fieldName: string, min: number = 0): number {
    if (value === null || value === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} é obrigatório`
      })
    }
    
    const num = Number(value)
    if (isNaN(num)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} deve ser um número válido`
      })
    }
    
    if (num < min) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} deve ser maior ou igual a ${min}`
      })
    }
    
    return num
  }
  
  // Validar email
  static validateEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email é obrigatório'
      })
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email inválido'
      })
    }
    
    return email.toLowerCase().trim()
  }
  
  // Validar telefone
  static validatePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Telefone é obrigatório'
      })
    }
    
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '')
    
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Telefone inválido'
      })
    }
    
    return cleanPhone
  }
  
  // Validar CEP
  static validateCEP(cep: string): string {
    if (!cep || typeof cep !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'CEP é obrigatório'
      })
    }
    
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '')
    
    if (cleanCEP.length !== 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'CEP deve ter 8 dígitos'
      })
    }
    
    return cleanCEP
  }
  
  // Validar array de objetos
  static validateObjectArray(value: any, fieldName: string, minLength: number = 1): any[] {
    if (!Array.isArray(value)) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} deve ser um array`
      })
    }
    
    if (value.length < minLength) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} deve ter pelo menos ${minLength} item(s)`
      })
    }
    
    return value
  }
  
  // Sanitizar HTML (prevenir XSS)
  static sanitizeHTML(html: string): string {
    if (!html || typeof html !== 'string') {
      return ''
    }
    
    // Remove tags HTML perigosas
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
      .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
  }
  
  // Validar URL
  static validateURL(url: string, fieldName: string = 'URL'): string {
    if (!url || typeof url !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} é obrigatória`
      })
    }
    
    try {
      new URL(url)
      return url.trim()
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} inválida`
      })
    }
  }
  
  // Validar status de pedido
  static validateOrderStatus(status: string): string {
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
    
    if (!status || typeof status !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status é obrigatório'
      })
    }
    
    if (!validStatuses.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status inválido'
      })
    }
    
    return status
  }
  
  // Validar tipo de movimento de estoque
  static validateInventoryMovementType(type: string): string {
    const validTypes = ['entrada', 'saida', 'ajuste', 'perda', 'transferencia']
    
    if (!type || typeof type !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tipo de movimento é obrigatório'
      })
    }
    
    if (!validTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tipo de movimento inválido'
      })
    }
    
    return type
  }
}

// Rate limiting simples
export class RateLimiter {
  private static requests = new Map<string, { count: number, resetTime: number }>()
  
  static checkLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now()
    const key = identifier
    
    const current = this.requests.get(key)
    
    if (!current || now > current.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (current.count >= maxRequests) {
      return false
    }
    
    current.count++
    return true
  }
  
  static getRemainingRequests(identifier: string, maxRequests: number = 100): number {
    const current = this.requests.get(identifier)
    if (!current) return maxRequests
    
    return Math.max(0, maxRequests - current.count)
  }
}

