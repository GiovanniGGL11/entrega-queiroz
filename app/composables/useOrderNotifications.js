// Instância global única (singleton) para evitar múltiplas instâncias
let globalNotificationsInstance = null
let globalPollInterval = null
let globalSSEConnection = null
let globalOnNewOrderCallback = null // Callback global para manter mesmo com singleton
let globalReconnectTimeout = null // Timeout global para reconexão
let globalReconnectAttempts = 0 // Contador de tentativas de reconexão
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY = 3000

// Composable para gerenciar notificações de pedidos em tempo real
// ATENÇÃO: Apenas para uso no dashboard de administradores
export const useOrderNotifications = () => {
  // Retornar instância global se já existe
  if (globalNotificationsInstance) {
    return globalNotificationsInstance
  }

  const notifications = ref([])
  const audioContext = ref(null)
  const isRunning = ref(false)
  const isConnected = ref(false)
  const onNewOrderCallback = ref(null)

  const { authenticatedFetch } = useAuthenticatedFetch()
  const { getAuthHeaders } = useAuthenticatedFetch()
  
  // Função para registrar callback quando novo pedido chegar
  const setOnNewOrderCallback = (callback) => {
    console.log('[Notificações] Registrando callback:', typeof callback)
    onNewOrderCallback.value = callback
    globalOnNewOrderCallback = callback // Também guardar globalmente
    console.log('[Notificações] Callback registrado:', !!onNewOrderCallback.value)
  }

  // Inicializar áudio de forma mais robusta
  const initAudio = async () => {
    if (!process.client || audioContext.value) return
    
    try {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
      
      // Criar um oscilador simples para teste
      if (audioContext.value.state === 'suspended') {
        // Aguardar primeira interação do usuário
        const unlock = async () => {
          try {
            await audioContext.value.resume()
            document.removeEventListener('click', unlock)
            document.removeEventListener('touchstart', unlock)
          } catch (e) {
            console.warn('Erro ao desbloquear áudio:', e)
          }
        }
        document.addEventListener('click', unlock, { once: true })
        document.addEventListener('touchstart', unlock, { once: true })
      }
    } catch (error) {
      console.warn('Erro ao inicializar áudio:', error)
    }
  }

  // Tocar som de notificação melhorado
  const playNotificationSound = async () => {
    try {
      if (!audioContext.value) {
        await initAudio()
      }
      
      if (!audioContext.value) return

      // Se estiver suspenso, tentar resumir
      if (audioContext.value.state === 'suspended') {
        await audioContext.value.resume()
      }

      // Criar dois tons sequenciais (beep-beep)
      const playBeep = (freq, duration, delay = 0) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            try {
              const oscillator = audioContext.value.createOscillator()
              const gainNode = audioContext.value.createGain()
              
              oscillator.connect(gainNode)
              gainNode.connect(audioContext.value.destination)
              
              oscillator.frequency.value = freq
              oscillator.type = 'sine'
              
              gainNode.gain.setValueAtTime(0.3, audioContext.value.currentTime)
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.value.currentTime + duration)
              
              oscillator.start(audioContext.value.currentTime)
              oscillator.stop(audioContext.value.currentTime + duration)
              
              oscillator.onended = () => resolve()
            } catch (e) {
              console.warn('Erro ao tocar beep:', e)
              resolve()
            }
          }, delay)
        })
      }

      // Tocar dois beeps
      await playBeep(800, 0.2, 0)
      await playBeep(1000, 0.15, 150)
    } catch (error) {
      console.warn('Erro ao tocar som de notificação:', error)
    }
  }

  // Conectar ao Server-Sent Events para notificações em tempo real
  const connectSSE = () => {
    if (!process.client) {
      console.log('[SSE] Não está no cliente, ignorando')
      return
    }

    // Se já existe conexão aberta, não criar nova
    if (globalSSEConnection) {
      const readyState = globalSSEConnection.readyState
      if (readyState === EventSource.OPEN || readyState === EventSource.CONNECTING) {
        console.log('[SSE] Já existe conexão ativa (readyState:', readyState, ')')
        return
      } else {
        // Conexão está fechada ou em erro, limpar
        console.log('[SSE] Conexão anterior estava fechada, limpando...')
        try {
          globalSSEConnection.close()
        } catch (e) {
          // Ignorar erros ao fechar conexão fechada
        }
        globalSSEConnection = null
      }
    }

    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.warn('[SSE] Sem token de autenticação')
        isConnected.value = false
        return
      }

      console.log('[SSE] Criando nova conexão SSE...')
      
      // Criar conexão SSE com token no query param (EventSource não suporta headers customizados)
      const eventSourceWithToken = new EventSource(`/api/orders/notifications?token=${encodeURIComponent(token)}`, {
        withCredentials: true
      })

      eventSourceWithToken.onopen = () => {
        isConnected.value = true
        globalReconnectAttempts = 0 // Resetar contador de tentativas em caso de sucesso
        console.log('[SSE] Conectado ao servidor de notificações')
        
        // Limpar timeout de reconexão se existir
        if (globalReconnectTimeout) {
          clearTimeout(globalReconnectTimeout)
          globalReconnectTimeout = null
        }
      }

      eventSourceWithToken.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connected') {
            console.log('[SSE]', data.message)
            return
          }
          
          if (data.type === 'new_order') {
            const order = data.order
            console.log('[SSE] Novo pedido recebido instantaneamente:', order?.orderNumber || order?._id)
            console.log('[SSE] Dados do pedido:', JSON.stringify(order, null, 2))
            
            // Validar se o pedido tem dados básicos
            if (!order || (!order.orderNumber && !order._id)) {
              console.warn('[SSE] Pedido recebido sem dados válidos')
              return
            }
            
            // PRIMEIRO: Chamar callback IMEDIATAMENTE para atualizar lista (antes de qualquer outra coisa)
            const callbackToCall = onNewOrderCallback.value || globalOnNewOrderCallback
            console.log('[SSE] Verificando callback IMEDIATAMENTE:', !!callbackToCall, typeof callbackToCall, 'local:', !!onNewOrderCallback.value, 'global:', !!globalOnNewOrderCallback)
            
            if (callbackToCall && typeof callbackToCall === 'function') {
              try {
                console.log('[SSE] Executando callback IMEDIATAMENTE para atualizar lista...')
                callbackToCall(order)
                console.log('[SSE] Callback executado com sucesso')
              } catch (error) {
                console.error('[SSE] Erro ao executar callback:', error)
              }
            } else {
              console.warn('[SSE] Callback não registrado ou inválido - local:', !!onNewOrderCallback.value, 'global:', !!globalOnNewOrderCallback)
            }
            
            // DEPOIS: Tocar som (não bloquear a atualização se falhar)
            playNotificationSound().catch(err => {
              console.warn('[SSE] Erro ao tocar som (não crítico):', err)
            })
            
            // DEPOIS: Adicionar notificação (evitar duplicatas)
            const orderId = order._id?.toString() || order.orderNumber
            const existingId = `notif-${orderId}`
            const exists = notifications.value.some(n => {
              const notifOrderId = n.order?._id?.toString() || n.order?.orderNumber
              return notifOrderId === orderId
            })
            
            console.log('[SSE] Verificando se notificação já existe:', exists, 'orderId:', orderId)
            
            if (!exists) {
              notifications.value.unshift({
                id: `${existingId}-${Date.now()}`,
                order: order,
                createdAt: order.createdAt || new Date(),
                read: false
              })
              
              console.log('[SSE] Notificação adicionada. Total:', notifications.value.length)
              
              // Limitar a 50 notificações
              if (notifications.value.length > 50) {
                notifications.value = notifications.value.slice(0, 50)
              }
            } else {
              console.log('[SSE] Notificação duplicada - já existe na lista')
            }
          }
        } catch (error) {
          console.error('[SSE] Erro ao processar evento:', error)
        }
      }

      eventSourceWithToken.onerror = (error) => {
        const readyState = eventSourceWithToken.readyState
        
        // EventSource.readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
        if (readyState === EventSource.CONNECTING) {
          // Ainda está tentando conectar, não fazer nada
          return
        }
        
        if (readyState === EventSource.CLOSED) {
          isConnected.value = false
          console.warn('[SSE] Conexão fechada. ReadyState:', readyState)
          
          // Limpar referência global
          if (globalSSEConnection === eventSourceWithToken) {
            globalSSEConnection = null
          }
          
          // Tentar reconectar apenas se ainda está rodando e não excedeu tentativas
          if (isRunning.value && globalReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            globalReconnectAttempts++
            
            // Limpar timeout anterior se existir
            if (globalReconnectTimeout) {
              clearTimeout(globalReconnectTimeout)
            }
            
            // Tentar reconectar com backoff exponencial
            const delay = RECONNECT_DELAY * Math.min(globalReconnectAttempts, 5)
            console.log(`[SSE] Tentando reconectar em ${delay}ms (tentativa ${globalReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)
            
            globalReconnectTimeout = setTimeout(() => {
              if (isRunning.value && !globalSSEConnection) {
                connectSSE()
              }
            }, delay)
          } else if (globalReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('[SSE] Número máximo de tentativas de reconexão atingido. Parando.')
            isRunning.value = false
            isConnected.value = false
          }
        }
      }

      globalSSEConnection = eventSourceWithToken
    } catch (error) {
      console.error('[SSE] Erro ao criar conexão:', error)
      isConnected.value = false
      
      // Tentar reconectar após erro
      if (isRunning.value && globalReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        globalReconnectAttempts++
        
        // Limpar timeout anterior se existir
        if (globalReconnectTimeout) {
          clearTimeout(globalReconnectTimeout)
        }
        
        globalReconnectTimeout = setTimeout(() => {
          if (isRunning.value && !globalSSEConnection) {
            connectSSE()
          }
        }, RECONNECT_DELAY)
      }
    }
  }

  // Iniciar notificações em tempo real via SSE (apenas para administradores no dashboard)
  const startNotifications = async () => {
    if (isRunning.value || globalSSEConnection) {
      console.log('[Notificações] Já está rodando, ignorando chamada duplicada')
      return
    }
    
    if (!process.client) {
      console.warn('[Notificações] Não está no cliente, ignorando')
      return
    }
    
    // Verificar se está em uma rota do dashboard (apenas para administradores)
    const currentPath = process.client ? (window.location.pathname || '') : ''
    
    if (!currentPath.startsWith('/dashboard')) {
      console.warn('[Notificações] Notificações disponíveis apenas no dashboard de administradores. Rota atual:', currentPath)
      return
    }
    
    // Verificar se há token de autenticação (administrador logado)
    const token = localStorage.getItem('auth_token')
    if (!token) {
      console.warn('[Notificações] Token de autenticação não encontrado. Apenas administradores podem receber notificações.')
      return
    }
    
    isRunning.value = true
    console.log('[Notificações] Iniciando sistema de notificações em tempo real (SSE) para administrador...')
    
    // Inicializar áudio
    await initAudio()
    
    // Conectar ao SSE para notificações instantâneas
    connectSSE()
    
    console.log('[Notificações] Sistema iniciado - usando Server-Sent Events para notificações instantâneas')
  }

  // Parar notificações
  const stopNotifications = () => {
    console.log('[Notificações] Parando sistema de notificações...')
    
    isRunning.value = false
    isConnected.value = false
    
    // Limpar intervalos de polling (se existirem)
    if (globalPollInterval) {
      clearInterval(globalPollInterval)
      globalPollInterval = null
    }
    
    // Limpar timeout de reconexão
    if (globalReconnectTimeout) {
      clearTimeout(globalReconnectTimeout)
      globalReconnectTimeout = null
    }
    
    // Fechar conexão SSE
    if (globalSSEConnection) {
      try {
        globalSSEConnection.close()
        console.log('[SSE] Conexão fechada')
      } catch (error) {
        console.warn('[SSE] Erro ao fechar conexão:', error)
      }
      globalSSEConnection = null
    }
    
    globalReconnectAttempts = 0
    console.log('[Notificações] Sistema parado completamente')
  }

  // Marcar notificação como lida
  const markAsRead = (notification) => {
    if (notification && notification.id) {
      const index = notifications.value.findIndex(n => n.id === notification.id)
      if (index !== -1) {
        notifications.value[index].read = true
      }
    }
  }

  // Limpar todas as notificações
  const clearAll = () => {
    notifications.value = []
  }

  // Limpar notificações lidas
  const clearRead = () => {
    notifications.value = notifications.value.filter(n => !n.read)
  }

  // Criar instância do composable
  const instance = {
    notifications,
    startNotifications,
    stopNotifications,
    markAsRead,
    clearAll,
    clearRead,
    playNotificationSound,
    isRunning,
    isConnected,
    setOnNewOrderCallback
  }

  // Guardar como instância global
  globalNotificationsInstance = instance

  return instance
}

