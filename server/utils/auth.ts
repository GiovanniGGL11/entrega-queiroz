import jwt from 'jsonwebtoken'
import { deleteCookie, getCookie, setCookie, getRequestHeader } from 'h3'

export const AUTH_COOKIE_NAME = 'auth_token'
export const LEGACY_COOKIE_NAME = 'authToken'

export function getJwtSecret(): string {
  const config = useRuntimeConfig()
  return (config.jwtSecret as string) || process.env.JWT_SECRET || 'your-secret-key'
}

export function signUserToken(payload: { userId: string; email: string }): string {
  const secret = getJwtSecret()
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyUserToken(token: string): { userId: string; email: string } {
  const secret = getJwtSecret()
  return jwt.verify(token, secret) as { userId: string; email: string }
}

export function readTokenFromEvent(event: any): string | undefined {
  const token = getCookie(event, AUTH_COOKIE_NAME) || getCookie(event, LEGACY_COOKIE_NAME)
  return token
}

export function setAuthCookie(event: any, token: string): void {
  setCookie(event, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  })
}

export function clearAuthCookie(event: any): void {
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  }

  const host = (getRequestHeader(event, 'host') || '').split(':')[0]
  const domainParts = host.split('.').filter(Boolean)
  const rootDomain = domainParts.length >= 2 ? domainParts.slice(-2).join('.') : host

  const domainCandidates: (string | undefined)[] = [
    undefined, // sem domain, mais comum em dev
    host || undefined,
    rootDomain && rootDomain !== host ? rootDomain : undefined,
    host ? `.${host}` : undefined,
    rootDomain && rootDomain !== host ? `.${rootDomain}` : undefined
  ].filter(Boolean)

  const names = [AUTH_COOKIE_NAME, LEGACY_COOKIE_NAME]

  for (const name of names) {
    // primeiro sem domain
    setCookie(event, name, '', baseOptions)
    try { deleteCookie(event, name, { path: '/' }) } catch {}

    // tentar com variações de domain
    for (const domain of domainCandidates) {
      const opts = { ...baseOptions, domain }
      setCookie(event, name, '', opts)
      try { deleteCookie(event, name, { path: '/', domain }) } catch {}
    }
  }
}


