import { ref } from 'vue'

// Estado global do modo e status da loja
const storeMode = ref('automatic') // 'automatic' ou 'manual'
const manualOverride = ref(null) // null = usar horário automático, true/false = override manual
const isStoreOpen = ref(false)

// Função para atualizar o modo da loja
const updateStoreMode = (mode) => {
  storeMode.value = mode
}

// Função para atualizar o override manual
const updateManualOverride = (override) => {
  manualOverride.value = override
}

// Função para atualizar o status da loja
const updateStoreStatus = (status) => {
  isStoreOpen.value = status
}

// Função para recarregar todos os dados
const reloadStoreStatus = async () => {
  if (!process.client) return
  
  try {
    const { useAuthenticatedFetch } = await import('~/composables/useAuthenticatedFetch')
    const { authenticatedFetch, clearCache } = useAuthenticatedFetch()
    
    // Limpar cache para garantir dados atualizados
    clearCache('/api/settings')
    
    // Fazer requisição sem cache
    const data = await authenticatedFetch('/api/settings', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    storeMode.value = data.storeMode || 'automatic'
    manualOverride.value = data.manualOverride !== undefined ? data.manualOverride : null
    
    // Se houver override manual, usar ele; senão usar o isOpen calculado
    if (manualOverride.value !== null) {
      isStoreOpen.value = manualOverride.value
    } else {
      isStoreOpen.value = data.isOpen || false
    }
  } catch (error) {
    console.error('Erro ao recarregar status da loja:', error)
  }
}

// Composable principal
export const useStoreStatus = () => {
  return {
    // Estado (retornando refs diretamente para reatividade)
    storeMode,
    manualOverride,
    isStoreOpen,
    
    // Métodos
    updateStoreMode,
    updateManualOverride,
    updateStoreStatus,
    reloadStoreStatus
  }
}

