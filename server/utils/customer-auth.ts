import jwt from 'jsonwebtoken'

function getSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key'
}

export function signCustomerToken(payload: { customerId: string; email: string }): string {
  return jwt.sign({ ...payload, type: 'customer' }, getSecret(), { expiresIn: '30d' })
}

export function verifyCustomerToken(token: string): { customerId: string; email: string } {
  const decoded = jwt.verify(token, getSecret()) as any
  if (decoded.type !== 'customer') throw new Error('Token inválido')
  return decoded
}
