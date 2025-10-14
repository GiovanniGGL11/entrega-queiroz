export default defineNuxtRouteMiddleware(async (to, from) => {
  // Rodar apenas no client-side
  if (process.server) return
  
  // Páginas públicas que não precisam de autenticação
  const publicPages = ['/login', '/']
  
  // Se está tentando acessar página pública, permitir
  if (publicPages.includes(to.path)) {
    return
  }
  
  // Todas as outras rotas (incluindo /dashboard/*) requerem autenticação
  try {
    // Verificar se está autenticado
    await $fetch('/api/auth/me', {
      credentials: 'include' // Importante para enviar cookies
    })
    // Se chegou aqui, está autenticado - pode prosseguir
  } catch (error) {
    // Não autenticado - redirecionar para login
    console.log('❌ Não autenticado, redirecionando para /login')
    return navigateTo('/login')
  }
})

