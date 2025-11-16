<template>
  <div class="dashboard" :style="{ '--sidebar-width': sidebarCollapsed ? '80px' : '280px' }">
    <!-- Overlay para mobile -->
    <div 
      v-if="isMobile && !sidebarCollapsed" 
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
            <path v-if="sidebarCollapsed" d="M5 12h14M12 5l7 7-7 7"/>
            <path v-else d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li>
            <NuxtLink to="/dashboard" class="nav-link" :class="{ active: $route.path === '/dashboard' }" :title="sidebarCollapsed ? 'Dashboard' : ''" @click="closeSidebarOnMobile">
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
            <NuxtLink to="/dashboard/categories" class="nav-link" :class="{ active: $route.path === '/dashboard/categories' }" :title="sidebarCollapsed ? 'Categorias' : ''" @click="closeSidebarOnMobile">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h18l-2 14H5L3 3z"></path>
                <path d="M8 21h8"></path>
              </svg>
              <span class="nav-text">Categorias</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/products" class="nav-link" :class="{ active: $route.path === '/dashboard/products' }" :title="sidebarCollapsed ? 'Produtos' : ''" @click="closeSidebarOnMobile">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span class="nav-text">Produtos</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/inventory" class="nav-link" :class="{ active: $route.path === '/dashboard/inventory' }" :title="sidebarCollapsed ? 'Estoque' : ''" @click="closeSidebarOnMobile">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h18l-2 14H5L3 3z"></path>
                <path d="M8 21h8"></path>
                <path d="M12 9v6"></path>
                <path d="M9 12h6"></path>
              </svg>
              <span class="nav-text">Estoque</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/orders" class="nav-link" :class="{ active: $route.path === '/dashboard/orders' }" :title="sidebarCollapsed ? 'Pedidos' : ''" @click="closeSidebarOnMobile">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span class="nav-text">Pedidos</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/dashboard/settings" class="nav-link" :class="{ active: $route.path === '/dashboard/settings' }" :title="sidebarCollapsed ? 'Configurações' : ''" @click="closeSidebarOnMobile">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span class="nav-text">Configurações</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      
      <!-- Status da Loja (apenas no modo manual) -->
      <div v-if="storeMode === 'manual'" class="store-status-section">
        <div class="store-status-header" v-if="!sidebarCollapsed">
          <span class="store-status-label">Status da Loja</span>
        </div>
        <div class="store-status-control">
          <div class="store-status-indicator" :class="{ 'open': isStoreOpen, 'closed': !isStoreOpen }">
            <div class="status-dot"></div>
            <span v-if="!sidebarCollapsed" class="status-text">{{ isStoreOpen ? 'Aberta' : 'Fechada' }}</span>
          </div>
          <label class="store-toggle-switch" :title="sidebarCollapsed ? (isStoreOpen ? 'Loja Aberta' : 'Loja Fechada') : ''">
            <input 
              type="checkbox" 
              :checked="isStoreOpen" 
              @click.prevent="handleToggleStoreStatus"
              :disabled="isTogglingStore"
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <!-- Status da Loja (apenas visual no modo automático) -->
      <div v-else class="store-status-section">
        <div class="store-status-header" v-if="!sidebarCollapsed">
          <span class="store-status-label">Status da Loja</span>
        </div>
        <div class="store-status-control">
          <div class="store-status-indicator" :class="{ 'open': isStoreOpen, 'closed': !isStoreOpen }">
            <div class="status-dot"></div>
            <span v-if="!sidebarCollapsed" class="status-text">{{ isStoreOpen ? 'Aberta' : 'Fechada' }}</span>
          </div>
          <div class="store-mode-info" v-if="!sidebarCollapsed">
            <small>Automático</small>
          </div>
        </div>
      </div>
      
      <div class="sidebar-footer">
        <button @click="handleLogoutAndCloseSidebar" class="logout-btn" :title="sidebarCollapsed ? 'Sair' : ''">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span class="nav-text">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Modal de Confirmação de Status da Loja -->
    <div v-if="showStoreStatusModal" class="modal-overlay" @click="cancelToggleStoreStatus">
      <div class="store-status-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon" :class="{ 'open': pendingStoreStatus, 'closed': !pendingStoreStatus }">
            <svg v-if="pendingStoreStatus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2>{{ pendingStoreStatus ? 'Abrir Loja' : 'Fechar Loja' }}</h2>
        </div>
        
        <div class="modal-content">
          <p>Tem certeza que deseja <strong>{{ pendingStoreStatus ? 'abrir' : 'fechar' }}</strong> a loja?</p>
          <p v-if="!pendingStoreStatus" class="warning-text">
            A loja ficará fechada e os clientes não poderão realizar pedidos.
          </p>
          <p v-else class="info-text">
            A loja ficará aberta e os clientes poderão realizar pedidos.
          </p>
        </div>
        
        <div class="modal-actions">
          <button @click="cancelToggleStoreStatus" class="btn-cancel">
            Cancelar
          </button>
          <button @click="confirmToggleStoreStatus" class="btn-confirm" :class="{ 'btn-open': pendingStoreStatus, 'btn-close': !pendingStoreStatus }">
            {{ pendingStoreStatus ? 'Abrir Loja' : 'Fechar Loja' }}
          </button>
        </div>
      </div>
    </div>

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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { useStoreStatus } from '~/composables/useStoreStatus'
const router = useRouter()

// Estado inicial: sempre false no SSR, será ajustado no cliente
const sidebarCollapsed = ref(false)
const isMobile = ref(false)
const isToggling = ref(false) // Prevenir múltiplos toggles
const isInitialized = ref(false) // Flag para evitar salvamento durante inicialização

// Carregar estado da sidebar do localStorage
const getSavedSidebarState = () => {
  if (process.client) {
    try {
      const saved = localStorage.getItem('sidebarCollapsed')
      if (saved !== null) {
        return saved === 'true'
      }
    } catch (e) {
      console.warn('Erro ao ler localStorage:', e)
    }
  }
  return false // Valor padrão: expandido
}

// Logo e nome da loja
const loadingSettings = ref(true)
const storeLogo = ref('')
const storeName = ref('')

// Status da loja - usando composable compartilhado
const { 
  storeMode, 
  manualOverride, 
  isStoreOpen, 
  reloadStoreStatus,
  updateStoreMode,
  updateManualOverride,
  updateStoreStatus
} = useStoreStatus()

const isTogglingStore = ref(false)

// Modal de confirmação
const showStoreStatusModal = ref(false)
const pendingStoreStatus = ref(false)

// Buscar configurações da loja
const loadStoreSettings = async () => {
  try {
    const data = await $fetch('/api/public/settings')
    storeLogo.value = data.logo || ''
    storeName.value = data.storeName || 'Dashboard'
    // Atualizar status usando o composable (apenas se não houver override manual)
    if (manualOverride.value === null) {
      updateStoreStatus(data.isOpen || false)
    }
  } catch (error) {
    console.error('Erro ao carregar configurações da loja:', error)
    storeName.value = 'Dashboard'
    updateStoreStatus(false)
  } finally {
    loadingSettings.value = false
  }
}

// Carregar status manual da loja - agora usando o composable
const loadStoreManualStatus = async () => {
  await reloadStoreStatus()
}

// Handler para alternar status (mostra modal de confirmação)
const handleToggleStoreStatus = (event) => {
  // Prevenir comportamento padrão do checkbox (não atualizar imediatamente)
  event.preventDefault()
  
  if (isTogglingStore.value) {
    return
  }
  
  // Salvar o status pendente (o novo status que será aplicado)
  pendingStoreStatus.value = !isStoreOpen.value
  
  // Mostrar modal de confirmação
  showStoreStatusModal.value = true
}

// Cancelar alternância de status (fechar modal sem alterar)
const cancelToggleStoreStatus = () => {
  showStoreStatusModal.value = false
  // Não precisa reverter nada porque o checkbox não foi alterado
}

// Confirmar alternância de status
const confirmToggleStoreStatus = async () => {
  if (isTogglingStore.value) return
  
  // Fechar modal
  showStoreStatusModal.value = false
  
  isTogglingStore.value = true
  
  try {
    const { authenticatedFetch } = useAuthenticatedFetch()
    const newStatus = pendingStoreStatus.value
    
    // Atualizar override manual
    await authenticatedFetch('/api/settings', {
      method: 'PUT',
      body: {
        manualOverride: newStatus
      }
    })
    
    // Atualizar estado global (isso atualizará o checkbox automaticamente)
    updateManualOverride(newStatus)
    updateStoreStatus(newStatus)
    
    // Recarregar status completo do backend para garantir sincronização
    await reloadStoreStatus()
    
    // Atualizar status público também (com pequeno delay para garantir que o backend processou)
    setTimeout(async () => {
      await loadStoreSettings()
    }, 500)
  } catch (error) {
    console.error('Erro ao atualizar status da loja:', error)
    alert('Erro ao atualizar status da loja. Tente novamente.')
    // Em caso de erro, recarregar o status do backend para garantir consistência
    await reloadStoreStatus()
  } finally {
    isTogglingStore.value = false
  }
}

const toggleSidebar = () => {
  // Prevenir múltiplos cliques rápidos
  if (isToggling.value) return
  
  isToggling.value = true
  
  // Alternar estado
  sidebarCollapsed.value = !sidebarCollapsed.value
  
  // Salvar no localStorage (apenas desktop e após inicialização)
  if (process.client && !isMobile.value && isInitialized.value) {
    try {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e)
    }
  }
  
  // Permitir novo toggle após a transição (300ms)
  setTimeout(() => {
    isToggling.value = false
  }, 300)
}

// Watcher para salvar automaticamente quando o estado mudar (apenas desktop, após inicialização)
watch(sidebarCollapsed, (newValue) => {
  // Não salvar durante a inicialização ou se for mobile
  if (process.client && !isMobile.value && isInitialized.value) {
    try {
      localStorage.setItem('sidebarCollapsed', newValue.toString())
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e)
    }
  }
})

// Função para fechar sidebar no mobile após navegação
const closeSidebarOnMobile = () => {
  if (isMobile.value) {
    sidebarCollapsed.value = true // true = escondido no mobile
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    })
    
    if (process.client) {
      // Limpar localStorage
      localStorage.removeItem('auth_token')
      sessionStorage.setItem('justLoggedOut', 'true')
    }
    
    // Redirecionar para login
    await router.push('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    if (process.client) {
      // Limpar localStorage mesmo em caso de erro
      localStorage.removeItem('auth_token')
      sessionStorage.setItem('justLoggedOut', 'true')
    }
    await router.push('/login')
  }
}

// Função combinada para logout e fechar sidebar no mobile
const handleLogoutAndCloseSidebar = async () => {
  closeSidebarOnMobile()
  await handleLogout()
}

// Título da página baseado na rota
const route = useRoute()
const pageTitle = computed(() => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/dashboard/categories': 'Categorias',
    '/dashboard/products': 'Produtos',
    '/dashboard/inventory': 'Estoque',
    '/dashboard/orders': 'Pedidos',
    '/dashboard/settings': 'Configurações'
  }
  return titles[route.path] || 'Dashboard'
})

// Atualizar status da loja periodicamente (quando não há override manual)
let storeStatusInterval = null

// Handler para atualização de configurações
const handleSettingsUpdate = async (event) => {
  // Recarregar dados da sidebar quando as configurações forem atualizadas
  await reloadStoreStatus()
  await loadStoreSettings()
}

// Responsividade
onMounted(() => {
  // Carregar configurações da loja
  loadStoreSettings()
  // Carregar status manual
  loadStoreManualStatus()
  
  // Escutar evento de atualização de configurações
  if (process.client) {
    window.addEventListener('store-settings-updated', handleSettingsUpdate)
  }
  
  // Atualizar status periodicamente se não houver override manual
  if (process.client) {
    storeStatusInterval = setInterval(async () => {
      if (manualOverride.value === null) {
        // Se não há override manual, atualizar status baseado nos horários
        await loadStoreSettings()
      }
    }, 30000) // Atualizar a cada 30 segundos
  }
  
  // Inicializar estado apenas no cliente
  if (process.client) {
    const isMobileDevice = window.innerWidth <= 768
    isMobile.value = isMobileDevice
    
    // Inicializar estado da sidebar
    if (isMobileDevice) {
      // Mobile: sempre iniciar fechado (não salvar)
      sidebarCollapsed.value = true
    } else {
      // Desktop: carregar do localStorage
      const savedState = getSavedSidebarState()
      sidebarCollapsed.value = savedState
      // Se não existe, criar com valor padrão
      if (localStorage.getItem('sidebarCollapsed') === null) {
        localStorage.setItem('sidebarCollapsed', 'false')
      }
    }
    
    // Marcar como inicializado após um pequeno delay para evitar salvamento durante inicialização
    setTimeout(() => {
      isInitialized.value = true
    }, 100)
  }
  
  const checkMobile = () => {
    const wasMobile = isMobile.value
    const isMobileDevice = window.innerWidth <= 768
    
    // Se não mudou de tipo de dispositivo, não fazer nada
    if (wasMobile === isMobileDevice) {
      return
    }
    
    isMobile.value = isMobileDevice
    
    // Se mudou de desktop para mobile
    if (!wasMobile && isMobileDevice) {
      sidebarCollapsed.value = true // Esconder no mobile (não salvar)
    } 
    // Se mudou de mobile para desktop
    else if (wasMobile && !isMobileDevice) {
      // Restaurar estado salvo no desktop
      const savedState = getSavedSidebarState()
      sidebarCollapsed.value = savedState
    }
  }
  
  window.addEventListener('resize', checkMobile)
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    if (process.client) {
      window.removeEventListener('store-settings-updated', handleSettingsUpdate)
    }
    if (storeStatusInterval) {
      clearInterval(storeStatusInterval)
      storeStatusInterval = null
    }
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
  overflow-y: auto; /* Permite scroll interno na sidebar */
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

/* Status da Loja */
.store-status-section {
  padding: 1rem 0.75rem;
  border-top: 2px solid #e5e7eb;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
}

.store-status-header {
  margin-bottom: 0.75rem;
}

.store-status-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.store-status-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.store-status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.store-status-indicator.open .status-dot {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: pulse-green 2s infinite;
}

.store-status-indicator.closed .status-dot {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.status-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-status-indicator.open .status-text {
  color: #10b981;
}

.store-status-indicator.closed .status-text {
  color: #ef4444;
}

.store-toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
  cursor: pointer;
}

.store-toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.store-toggle-switch input:checked + .toggle-slider {
  background-color: #10b981;
}

.store-toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.store-toggle-switch input:disabled + .toggle-slider {
  opacity: 0.6;
  cursor: not-allowed;
}

.store-mode-info {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  flex-shrink: 0;
}

.store-mode-info small {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1);
  }
}

.sidebar-collapsed .store-status-section {
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-collapsed .store-status-header,
.sidebar-collapsed .status-text {
  display: none;
}

.sidebar-collapsed .store-status-control {
  flex-direction: column;
  width: 100%;
}

.sidebar-collapsed .store-status-indicator {
  justify-content: center;
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
    width: 280px;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .admin-sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }
  
  .admin-sidebar.sidebar-collapsed {
    transform: translateX(-100%);
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
    position: sticky;
    top: 0;
    z-index: 100;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .dashboard-content {
    padding: 1rem;
    min-height: calc(100vh - 68px);
  }
  
  .sidebar-header {
    padding: 1rem;
  }
  
  .sidebar-nav {
    padding: 0.5rem 0;
    flex: 1;
    overflow-y: auto;
  }
  
  .nav-link {
    padding: 0.75rem 1rem;
    min-height: 44px;
  }
  
  .sidebar-footer {
    padding: 1rem;
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 1;
    border-top: 1px solid #e5e7eb;
  }
  
  .logout-btn {
    min-height: 44px;
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

/* Modal de Confirmação de Status */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.store-status-modal {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.store-status-modal .modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.modal-icon.open {
  background: #d1fae5;
  color: #10b981;
}

.modal-icon.closed {
  background: #fee2e2;
  color: #ef4444;
}

.store-status-modal .modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.store-status-modal .modal-content {
  padding: 1.5rem;
}

.store-status-modal .modal-content p {
  margin: 0 0 0.75rem 0;
  color: #374151;
  line-height: 1.5;
}

.store-status-modal .modal-content p:last-child {
  margin-bottom: 0;
}

.warning-text {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
}

.info-text {
  color: #059669;
  font-size: 0.875rem;
  font-weight: 500;
}

.store-status-modal .modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.store-status-modal .btn-cancel {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 2px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.store-status-modal .btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.store-status-modal .btn-confirm {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.store-status-modal .btn-confirm.btn-open {
  background: #10b981;
}

.store-status-modal .btn-confirm.btn-open:hover {
  background: #059669;
}

.store-status-modal .btn-confirm.btn-close {
  background: #ef4444;
}

.store-status-modal .btn-confirm.btn-close:hover {
  background: #dc2626;
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