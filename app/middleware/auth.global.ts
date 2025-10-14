export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log(`🔐 Middleware auth verificando rota: ${to.path}`)

  // Páginas públicas que não precisam de autenticação
  const publicPages = ['/login', '/']

  // Se está tentando acessar página pública, permitir
  if (publicPages.includes(to.path)) {
    console.log('✅ Rota pública, acesso permitido')
    return
  }

  // Se estiver no server, valide de forma autoritativa via API usando os cookies do request
  if (process.server) {
    try {
      const headers = useRequestHeaders(['cookie'])
      await $fetch('/api/auth/me', { headers })
      // Autenticado no SSR, permitir
      return
    } catch (error) {
      console.log('❌ SSR não autenticado, redirecionando para /login', error)
      return navigateTo('/login')
    }
  }

  // Client: validação autoritativa via API (sem flags locais)

  // Todas as outras rotas (incluindo /dashboard/*) requerem autenticação
  try {
    // Verificar se está autenticado - evitar cache
    await $fetch(`/api/auth/me?t=${Date.now()}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    console.log('✅ Autenticado, acesso permitido ao dashboard')
  } catch (error) {
    // Não autenticado - redirecionar para login
    console.log('❌ Não autenticado, redirecionando para /login', error)
    return navigateTo('/login')
  }
})

