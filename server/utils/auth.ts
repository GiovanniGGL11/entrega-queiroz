import jwt from 'jsonwebtoken'
import { deleteCookie, getCookie, setCookie, getRequestHeader } from 'h3'

export const AUTH_COOKIE_NAME = 'auth_token'
export const LEGACY_COOKIE_NAME = 'authToken'

export function getJwtSecret(): string {
  const config = useRuntimeConfig()
  return (config.jwtSecret as string) || process.env.JWT_SECRET || 'your-secret-key'
}

export function signUserToken(payload: { userId: string; email: string; role?: string; name?: string }): string {
  const secret = getJwtSecret()
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyUserToken(token: string): { userId: string; email: string; role?: string; name?: string } {
  const secret = getJwtSecret()
  return jwt.verify(token, secret) as { userId: string; email: string; role?: string; name?: string }
}

export function readTokenFromEvent(event: any): string | undefined {
  const token = getCookie(event, AUTH_COOKIE_NAME) || getCookie(event, LEGACY_COOKIE_NAME)
  return token
}

export function setAuthCookie(event: any, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Configuração otimizada para Vercel
  const cookieOptions: any = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax', // 'none' necessário para HTTPS cross-origin
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  }
  
  // Para produção na Vercel, não definir domínio específico
  // Deixar o navegador gerenciar automaticamente
  
  setCookie(event, AUTH_COOKIE_NAME, token, cookieOptions)
  
  // Log para debug em produção
  if (isProduction) {
    // Debug info removido para produção
  }
}

export function clearAuthCookie(event: any): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  }

  const names = [AUTH_COOKIE_NAME, LEGACY_COOKIE_NAME]

  for (const name of names) {
    // Limpar cookie sem domínio específico
    setCookie(event, name, '', baseOptions)
    try { 
      deleteCookie(event, name, { path: '/' }) 
    } catch {}
  }
  
  // Log para debug em produção
  if (isProduction) {
  }
}
