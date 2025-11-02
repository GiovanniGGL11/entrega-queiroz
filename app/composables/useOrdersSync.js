// Composables para sincronização de pedidos em tempo real
export const useOrdersSync = (options = {}) => {
  const {
    interval = 3000, // 3 segundos por padrão
    onNewOrder = null, // Callback quando novo pedido for detectado
    enabled = ref(true) // Se a sincronização está ativa
  } = options

  const { authenticatedFetch } = useAuthenticatedFetch()
  
  const isSyncing = ref(false)
  const lastOrderTime = ref(null)
  const newOrdersCount = ref(0)
  let pollInterval = null
  let audioContext = null
  let audioBuffer = null

  // Criar som de notificação (beep simples)
  const createNotificationSound = async () => {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Criar um beep simples (tone)
      const sampleRate = audioContext.sampleRate
      const duration = 0.2 // 200ms
      const frequency = 800 // Hz
      const frames = Math.floor(sampleRate * duration)
      
      audioBuffer = audioContext.createBuffer(1, frames, sampleRate)
      const channelData = audioBuffer.getChannelData(0)
      
      for (let i = 0; i < frames; i++) {
        channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3
      }
    } catch (error) {
      console.warn('Erro ao criar som de notificação:', error)
    }
  }

  // Tocar som de notificação
  const playNotificationSound = async () => {
    try {
      // Se não temos contexto, criar agora
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      // Se o contexto estiver suspenso (por políticas do navegador), tentar resumir
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      
      // Criar buffer na hora (mais confiável)
      const sampleRate = audioContext.sampleRate
      const duration = 0.2 // 200ms
      const frequency = 800 // Hz
      const frames = Math.floor(sampleRate * duration)
      
      const buffer = audioContext.createBuffer(1, frames, sampleRate)
      const channelData = buffer.getChannelData(0)
      
      for (let i = 0; i < frames; i++) {
        channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.5
      }
      
      // Primeiro beep
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
      
      // Segundo beep mais agudo após delay
      setTimeout(() => {
        try {
          const buffer2 = audioContext.createBuffer(1, Math.floor(sampleRate * 0.15), sampleRate)
          const channelData2 = buffer2.getChannelData(0)
          const frequency2 = 1000 // Hz mais agudo
          for (let i = 0; i < channelData2.length; i++) {
            channelData2[i] = Math.sin(2 * Math.PI * frequency2 * i / sampleRate) * 0.5
          }
          const source2 = audioContext.createBufferSource()
          source2.buffer = buffer2
          source2.connect(audioContext.destination)
          source2.start(0)
        } catch (e) {
          console.warn('Erro no segundo beep:', e)
        }
      }, 150)
      
    } catch (error) {
      console.warn('Erro ao tocar som de notificação:', error)
      // Fallback: tentar usar HTML5 Audio API
      try {
        const audio = new Audio()
        // Criar um data URL com um tom simples
        const audioContext2 = new (window.AudioContext || window.webkitAudioContext)()
        const sampleRate = audioContext2.sampleRate
        const duration = 0.3
        const frequency = 800
        const frames = Math.floor(sampleRate * duration)
        const buffer = audioContext2.createBuffer(1, frames, sampleRate)
        const channelData = buffer.getChannelData(0)
        
        for (let i = 0; i < frames; i++) {
          channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.5
        }
        
        const source = audioContext2.createBufferSource()
        source.buffer = buffer
        source.connect(audioContext2.destination)
        
        if (audioContext2.state === 'suspended') {
          audioContext2.resume().then(() => {
            source.start(0)
          })
        } else {
          source.start(0)
        }
      } catch (fallbackError) {
        console.warn('Erro no fallback de áudio:', fallbackError)
      }
    }
  }

  // Verificar novos pedidos
  const checkNewOrders = async () => {
    if (!enabled.value || isSyncing.value) return
    
    try {
      isSyncing.value = true
      
      const query = lastOrderTime.value 
        ? `?since=${new Date(lastOrderTime.value).toISOString()}`
        : '?page=1&limit=100'
      
      const response = await authenticatedFetch(`/api/orders${query}`)
      const ordersData = response.orders || response
      
      if (Array.isArray(ordersData) && ordersData.length > 0) {
        // Ordenar por data de criação (mais recente primeiro)
        const sortedOrders = ordersData.sort((a, b) => {
          const dateA = new Date(a.createdAt)
          const dateB = new Date(b.createdAt)
          return dateB - dateA
        })
        
        // Se temos um lastOrderTime, verificar apenas pedidos novos
        if (lastOrderTime.value) {
          const newOrders = sortedOrders.filter(order => {
            const orderDate = new Date(order.createdAt)
            return orderDate > new Date(lastOrderTime.value)
          })
          
          if (newOrders.length > 0) {
            // Atualizar lastOrderTime para o pedido mais recente
            lastOrderTime.value = sortedOrders[0].createdAt
            
            // Tocar som de notificação (await para garantir que toque)
            await playNotificationSound()
            
            // Incrementar contador
            newOrdersCount.value += newOrders.length
            
            // Chamar callback se fornecido
            if (onNewOrder && typeof onNewOrder === 'function') {
              onNewOrder(newOrders)
            }
            
            return newOrders
          }
        } else {
          // Primeira verificação: apenas salvar o último tempo
          if (sortedOrders.length > 0) {
            lastOrderTime.value = sortedOrders[0].createdAt
          }
        }
      }
      
      return []
    } catch (error) {
      console.error('Erro ao verificar novos pedidos:', error)
      return []
    } finally {
      isSyncing.value = false
    }
  }

  // Iniciar sincronização
  const startSync = async () => {
    if (pollInterval) return
    
    // Tentar inicializar contexto de áudio (com interação do usuário)
    if (process.client) {
      try {
        // Criar contexto na inicialização pode ajudar
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        
        // Tentar resumir se estiver suspenso (requer interação do usuário)
        if (audioContext.state === 'suspended') {
          // Criar um evento de clique para "desbloquear" o áudio
          const unlockAudio = async () => {
            try {
              await audioContext.resume()
              document.removeEventListener('click', unlockAudio)
              document.removeEventListener('touchstart', unlockAudio)
            } catch (e) {
              console.warn('Erro ao desbloquear áudio:', e)
            }
          }
          document.addEventListener('click', unlockAudio, { once: true })
          document.addEventListener('touchstart', unlockAudio, { once: true })
        }
      } catch (error) {
        console.warn('Erro ao inicializar contexto de áudio:', error)
      }
    }
    
    // Verificar imediatamente
    await checkNewOrders()
    
    // Configurar polling
    pollInterval = setInterval(() => {
      if (enabled.value) {
        checkNewOrders()
      }
    }, interval)
  }

  // Parar sincronização
  const stopSync = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  // Resetar contador de novos pedidos
  const resetNewOrdersCount = () => {
    newOrdersCount.value = 0
  }

  // Atualizar manualmente
  const refresh = async () => {
    await checkNewOrders()
  }

  // Função para testar o som (útil para desbloquear áudio)
  const testSound = async () => {
    await playNotificationSound()
  }

  return {
    isSyncing,
    newOrdersCount,
    startSync,
    stopSync,
    refresh,
    resetNewOrdersCount,
    checkNewOrders,
    testSound
  }
}
