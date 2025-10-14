<template>
  <div class="dashboard">
    <!-- Overlay para mobile -->
    <div 
      v-if="!sidebarCollapsed && isMobile" 
      class="sidebar-overlay" 
      @click="toggleSidebar"
    ></div>
    
    <!-- Sidebar Admin -->
    <aside class="admin-sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <h2>Admin Panel</h2>
        <button @click="toggleSidebar" class="sidebar-toggle">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li>
            <NuxtLink to="/dashboard" class="nav-link" :class="{ active: $route.path === '/dashboard' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/categories" class="nav-link" :class="{ active: $route.path === '/dashboard/categories' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h18l-2 14H5L3 3z"></path>
                <path d="M8 21h8"></path>
              </svg>
              <span>Categorias</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/products" class="nav-link" :class="{ active: $route.path === '/dashboard/products' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>Produtos</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/orders" class="nav-link" :class="{ active: $route.path === '/dashboard/orders' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span>Pedidos</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/settings" class="nav-link" :class="{ active: $route.path === '/dashboard/settings' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
              </svg>
              <span>Configurações</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Sair</span>
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
const sidebarCollapsed = ref(false)
const isMobile = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await navigateTo('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
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
  const checkMobile = () => {
    const isMobileDevice = window.innerWidth <= 768
    isMobile.value = isMobileDevice
    
    if (isMobileDevice) {
      sidebarCollapsed.value = true
    } else {
      sidebarCollapsed.value = false
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
  background-color: #f8fafc;
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
  background: #f8f9fa;
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  position: fixed;
  height: 100vh;
  z-index: 1000;
}

.admin-sidebar.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  transition: opacity 0.3s ease;
}

.sidebar-collapsed .sidebar-header h2 {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.sidebar-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
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
  padding: 0.875rem 1.5rem;
  color: #6c757d;
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #2c3e50;
}

.nav-link.active {
  background-color: rgba(0, 0, 0, 0.08);
  color: #FF6B35;
  border-left-color: #FF6B35;
}

.nav-link svg {
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.nav-link span {
  transition: opacity 0.3s ease;
}

.sidebar-collapsed .nav-link span {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: #dc3545;
  border: none;
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.logout-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.logout-btn svg {
  flex-shrink: 0;
}

.logout-btn span {
  transition: opacity 0.3s ease;
}

.sidebar-collapsed .logout-btn span {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.main-wrapper {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
}

.main-wrapper.sidebar-collapsed {
  margin-left: 80px;
}

.dashboard-header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  }
  
  .main-wrapper.sidebar-collapsed {
    margin-left: 70px;
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
  }
  
  .main-wrapper.sidebar-collapsed {
    margin-left: 0;
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
  
  .theme-btn, .logout-btn {
    padding: 0.875rem;
  }
}
</style>

