// Rotas que só o dono pode acessar
const ownerOnlyRoutes = [
  '/dashboard',
  '/dashboard/categories',
  '/dashboard/products',
  '/dashboard/customers',
  '/dashboard/coupons',
  '/dashboard/employees',
  '/dashboard/settings'
]

const getTokenRole = () => {
  if (!process.client) return null
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role || 'owner'
  } catch {
    return null
  }
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Páginas públicas que não precisam de autenticação
  const publicPages = ['/login', '/', '/checkout', '/auth/google-cliente', '/auth/google-sucesso']

  if (publicPages.includes(to.path)) {
    return
  }

  // Rotas de rastreamento de pedido são públicas
  if (to.path.startsWith('/pedido/')) {
    return
  }

  // SSR: validar via cookie
  if (process.server) {
    try {
      const headers = useRequestHeaders(['cookie'])
      await $fetch('/api/auth/me', { headers })
      return
    } catch (error) {
      return navigateTo('/login')
    }
  }

  // Client: validação via API
  try {
    let lastError = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const headers: any = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
        if (process.client) {
          const token = localStorage.getItem('auth_token')
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }
        }
        await $fetch(`/api/auth/me?t=${Date.now()}`, {
          credentials: 'include',
          headers
        })
        const role = getTokenRole()
        if (role === 'employee' && ownerOnlyRoutes.includes(to.path)) {
          return navigateTo('/dashboard/orders')
        }
        return
      } catch (error: any) {
        lastError = error
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
    return navigateTo('/login')
  } catch (error) {
    return navigateTo('/login')
  }
})
