<template>
  <div class="dashboard" :style="{ '--sidebar-width': sidebarCollapsed ? '80px' : '280px' }">
    <!-- Overlay para mobile -->
    <div 
      v-if="!sidebarCollapsed && isMobile" 
      class="sidebar-overlay" 
      @click="toggleSidebar"
    ></div>
    
    <!-- Sidebar Admin -->
    <aside class="admin-sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="brand" v-if="!sidebarCollapsed">
          <template v-if="loadingSettings">
            <div class="skeleton-logo"></div>
            <div class="skeleton-text"></div>
          </template>
          <template v-else>
            <div class="brand-logo">
              <img v-if="storeLogo" :src="storeLogo" :alt="storeName" />
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <span class="brand-text">{{ storeName || 'Dashboard' }}</span>
          </template>
        </div>
        <button @click="toggleSidebar" class="sidebar-toggle" :class="{ 'collapsed': sidebarCollapsed }" :title="sidebarCollapsed ? 'Expandir' : 'Recolher'">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path :d="sidebarCollapsed ? 'M5 12h14M12 5l7 7-7 7' : 'M19 12H5M12 19l-7-7 7-7'"/>
          </svg>
        </button>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li>
            <NuxtLink to="/dashboard" class="nav-link" :class="{ active: $route.path === '/dashboard' }" :title="sidebarCollapsed ? 'Dashboard' : ''">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span class="nav-text">Dashboard</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/categories" class="nav-link" :class="{ active: $route.path === '/dashboard/categories' }" :title="sidebarCollapsed ? 'Categorias' : ''">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h18l-2 14H5L3 3z"></path>
                <path d="M8 21h8"></path>
              </svg>
              <span class="nav-text">Categorias</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/products" class="nav-link" :class="{ active: $route.path === '/dashboard/products' }" :title="sidebarCollapsed ? 'Produtos' : ''">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span class="nav-text">Produtos</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/orders" class="nav-link" :class="{ active: $route.path === '/dashboard/orders' }" :title="sidebarCollapsed ? 'Pedidos' : ''">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span class="nav-text">Pedidos</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/settings" class="nav-link" :class="{ active: $route.path === '/dashboard/settings' }" :title="sidebarCollapsed ? 'Configurações' : ''">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span class="nav-text">Configurações</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn" :title="sidebarCollapsed ? 'Sair' : ''">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span class="nav-text">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="main-wrapper" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <header class="dashboard-header">
        <button @click="toggleSidebar" class="mobile-menu-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="header-content">
          <h1>{{ pageTitle }}</h1>
        </div>
      </header>
      <main class="dashboard-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()
// Carregar estado da sidebar do localStorage
const getSavedSidebarState = () => {
  if (process.client) {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved === 'true'
  }
  return false
}

const sidebarCollapsed = ref(getSavedSidebarState())
const isMobile = ref(false)

// Logo e nome da loja
const loadingSettings = ref(true)
const storeLogo = ref('')
const storeName = ref('')

// Buscar configurações da loja
const loadStoreSettings = async () => {
  try {
    const data = await $fetch('/api/settings')
    storeLogo.value = data.logo || ''
    storeName.value = data.storeName || 'Dashboard'
  } catch (error) {
    console.error('Erro ao carregar configurações da loja:', error)
    storeName.value = 'Dashboard'
  } finally {
    loadingSettings.value = false
  }
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  
  // Salvar estado no localStorage
  if (process.client) {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    })
    
    if (process.client) {
      sessionStorage.setItem('justLoggedOut', 'true')
    }
    
    // Redirecionar para login
    await router.push('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    if (process.client) {
      sessionStorage.setItem('justLoggedOut', 'true')
    }
    await router.push('/login')
  }
}

// Título da página baseado na rota
const route = useRoute()
const pageTitle = computed(() => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/dashboard/categories': 'Categorias',
    '/dashboard/products': 'Produtos',
    '/dashboard/orders': 'Pedidos',
    '/dashboard/settings': 'Configurações'
  }
  return titles[route.path] || 'Dashboard'
})

// Responsividade
onMounted(() => {
  // Carregar configurações da loja
  loadStoreSettings()
  
  const checkMobile = () => {
    const isMobileDevice = window.innerWidth <= 768
    isMobile.value = isMobileDevice
    
    // No mobile, sempre recolher
    if (isMobileDevice) {
      sidebarCollapsed.value = true
    } else {
      // No desktop, usar o estado salvo no localStorage
      sidebarCollapsed.value = getSavedSidebarState()
    }
  }
  
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
})
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
  background-color: #ffffff;
  position: relative;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: none;
}

@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
  }
}

.admin-sidebar {
  width: 280px;
  background: #ffffff;
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 2px solid #e5e7eb;
  position: fixed;
  height: 100vh;
  z-index: 1000;
}

.admin-sidebar.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: #ffffff;
  color: #2c3e50;
  height: 68px;
  box-sizing: border-box;
}

.sidebar-collapsed .sidebar-header {
  justify-content: center;
  padding: 1rem 0;
}

.sidebar-toggle.collapsed {
  margin: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
}

.brand-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-logo svg {
  width: 20px;
  height: 20px;
}

.brand-text {
  font-size: 1.125rem;
  font-weight: 600;
  white-space: nowrap;
  transition: opacity 0.3s ease, width 0.3s ease;
}

.sidebar-collapsed .brand-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar-toggle {
  background: #f3f4f6;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background-color: #e5e7eb;
  color: #FF6B35;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.sidebar-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar-nav li {
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  margin: 0.25rem 0.75rem;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border-radius: 10px;
  font-weight: 500;
  box-sizing: border-box;
}

.nav-link svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  white-space: nowrap;
  transition: opacity 0.3s ease, width 0.3s ease;
}

.sidebar-collapsed .nav-text {
  display: none;
}

.sidebar-collapsed .nav-link {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem;
  margin: 0.25rem 0.75rem;
  width: auto;
  min-height: 44px;
}

.nav-link:hover {
  background-color: #f3f4f6;
  color: #FF6B35;
}

.nav-link.active {
  background: linear-gradient(135deg, #FF6B35 0%, #ff8e24 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 2px solid #e5e7eb;
}

.sidebar-collapsed .sidebar-footer {
  display: flex;
  justify-content: center;
  padding: 0.75rem 0;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1.25rem;
  margin: 0.25rem 0;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  box-sizing: border-box;
}

.logout-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-collapsed .logout-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem;
  margin: 0.25rem 0.75rem;
  width: auto;
  min-height: 44px;
}

.sidebar-collapsed .logout-btn .nav-text {
  display: none;
}

.logout-btn:hover {
  background: #dc2626;
  color: white;
}

/* Skeleton Loading */
.skeleton-logo {
  width: 36px;
  height: 36px;
  background: #e5e7eb;
  border-radius: 8px;
  animation: shimmer 1.5s infinite;
}

.skeleton-text {
  width: 120px;
  height: 20px;
  background: #e5e7eb;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}

.sidebar-collapsed .skeleton-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

@keyframes shimmer {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.main-wrapper {
  flex: 1;
  margin-left: 280px;
  width: calc(100% - 280px);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.main-wrapper.sidebar-collapsed {
  margin-left: 80px;
  width: calc(100% - 80px);
}

.dashboard-header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 68px;
  box-sizing: border-box;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.mobile-menu-btn:hover {
  background-color: #f1f5f9;
}

.header-content h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.dashboard-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Responsividade */
@media (max-width: 1024px) {
  .admin-sidebar {
    width: 260px;
  }
  
  .main-wrapper {
    margin-left: 260px;
    width: calc(100% - 260px);
  }
  
  .main-wrapper.sidebar-collapsed {
    margin-left: 70px;
    width: calc(100% - 70px);
  }
  
  .admin-sidebar.sidebar-collapsed {
    width: 70px;
  }
}

@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    width: 280px;
    z-index: 1001;
  }
  
  .admin-sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }
  
  .main-wrapper {
    margin-left: 0;
    width: 100%;
  }
  
  .main-wrapper.sidebar-collapsed {
    margin-left: 0;
    width: 100%;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .dashboard-header {
    padding: 1rem 1.5rem;
  }
  
  .dashboard-content {
    padding: 1rem;
  }
  
  .sidebar-header {
    padding: 1rem;
  }
  
  .sidebar-nav {
    padding: 0.5rem 0;
  }

 
  
  .nav-link {
    padding: 0.75rem 1rem;
  }
  
  .sidebar-footer {
    padding: 1rem;
  }
}

@media (max-width: 640px) {
  .dashboard-header {
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .header-content h1 {
    font-size: 1.25rem;
    flex: 1;
    min-width: 0;
  }
  
  .mobile-menu-btn {
    padding: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .dashboard-content {
    padding: 0.75rem;
  }
  
  .admin-sidebar {
    width: 100vw;
    max-width: 320px;
  }
  
  .sidebar-header h2 {
    font-size: 1.125rem;
  }
  
  .nav-link {
    padding: 1rem;
    font-size: 0.875rem;
  }
  
  .nav-link svg {
    width: 20px;
    height: 20px;
  }
  
  .theme-btn, .logout-btn {
    padding: 1rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: 0.5rem;
  }
  
  .header-content h1 {
    font-size: 1.125rem;
  }
  
  .dashboard-content {
    padding: 0.5rem;
  }
  
  .admin-sidebar {
    width: 100vw;
  }
  
  .sidebar-header {
    padding: 0.75rem;
  }
  
  .sidebar-footer {
    padding: 0.75rem;
  }
  
  .nav-link {
    padding: 0.875rem 0.75rem;
  }

   /* .sidebar-nav li {
    display: flex;
    justify-content: center;
  } */
  
  .theme-btn, .logout-btn {
    padding: 0.875rem;
  }
}
</style>