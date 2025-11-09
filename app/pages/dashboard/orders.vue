<template>
  <div class="orders-page">
    <div class="page-header">
      <div class="header-left">
        <h1>Gerenciar Pedidos</h1>
      </div>
      <div class="header-actions">
        <select v-model="statusFilter" @change="loadOrders" class="filter-select">
          <option value="">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="confirmed">Confirmados</option>
          <option value="preparing">Preparando</option>
          <option value="ready">Prontos</option>
          <option value="out_for_delivery">Saiu para entrega</option>
          <option value="delivered">Entregues</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <button @click="refreshOrders" class="btn-refresh" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
          </svg>
          {{ loading ? 'Carregando...' : 'Atualizar' }}
        </button>
        <button @click="syncEnabled = !syncEnabled; syncEnabled ? startNotifications() : stopNotifications(); testSound()" class="btn-sync-toggle" :class="{ 'active': syncEnabled }" :title="syncEnabled ? 'Sincronização ativa (clique para testar som)' : 'Sincronização pausada'">
          <svg v-if="syncEnabled" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Lista de Pedidos -->
    <div class="orders-list">
      <div v-if="loading" class="loading">
        <p>Carregando pedidos...</p>
      </div>
      
      <div v-else-if="orders.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>
        <h3>Nenhum pedido encontrado</h3>
        <p>Os pedidos aparecerão aqui quando forem feitos</p>
      </div>

      <div v-else class="orders-grid">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <div class="order-info">
              <h3>Pedido #{{ order.id }}</h3>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <span class="status-badge" :class="order.status">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          
          <div class="order-details">
            <div class="customer-info">
              <strong>{{ order.customer }}</strong>
              <span v-if="order.phone">{{ order.phone }}</span>
            </div>
            
            <div class="order-items">
              <div v-for="item in order.items" :key="item.id" class="order-item">
                <span class="item-quantity">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">{{ formatCurrency(item.price) }}</span>
              </div>
            </div>
            
            <div class="order-total">
              <strong>Total: {{ formatCurrency(order.total) }}</strong>
            </div>
          </div>
          
          <div class="order-actions">
            <button 
              @click="showEditStatusModal(order)" 
              class="btn-edit"
            >
              Editar Status
            </button>
            <button @click="viewOrderDetails(order)" class="btn-view">
              Ver Detalhes
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalhes do Pedido -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeOrderModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Pedido #{{ selectedOrder.id }}</h3>
          <button @click="closeOrderModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="order-details-full">
            <div class="detail-section">
              <h4>Informações do Cliente</h4>
              <div class="detail-row">
                <span class="label">Nome:</span>
                <span class="value">{{ selectedOrder.customer }}</span>
              </div>
              <div class="detail-row" v-if="selectedOrder.phone">
                <span class="label">Telefone:</span>
                <span class="value">{{ selectedOrder.phone }}</span>
              </div>
              <div class="detail-row" v-if="selectedOrder.address">
                <span class="label">Endereço:</span>
                <span class="value">
                  {{ selectedOrder.address }}
                  <span v-if="selectedOrder.number">, nº {{ selectedOrder.number }}</span>
                  <span v-if="selectedOrder.complement">, {{ selectedOrder.complement }}</span>
                </span>
              </div>
              <div class="detail-row" v-if="selectedOrder.neighborhood || selectedOrder.city">
                <span class="label">Bairro/Cidade:</span>
                <span class="value">
                  <span v-if="selectedOrder.neighborhood">{{ selectedOrder.neighborhood }}</span>
                  <span v-if="selectedOrder.neighborhood && selectedOrder.city">, </span>
                  <span v-if="selectedOrder.city">{{ selectedOrder.city }}</span>
                </span>
              </div>
              <div class="detail-row" v-if="selectedOrder.zipCode">
                <span class="label">CEP:</span>
                <span class="value">{{ selectedOrder.zipCode }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>Itens do Pedido</h4>
              <div v-for="item in selectedOrder.items" :key="item.id" class="order-item-full">
                <div class="item-info">
                  <span class="item-quantity">{{ item.quantity }}x</span>
                  <span class="item-name">{{ item.name }}</span>
                </div>
                <span class="item-price">{{ formatCurrency(item.price) }}</span>
                <div v-if="item.complements && item.complements.length > 0" class="item-complements">
                  <div v-for="complement in item.complements" :key="complement.name" class="complement">
                    + {{ complement.name }} ({{ complement.quantity }}x)
                  </div>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>Resumo</h4>
              <div class="detail-row">
                <span class="label">Subtotal:</span>
                <span class="value">{{ formatCurrency(selectedOrder.subtotal) }}</span>
              </div>
              <div class="detail-row" v-if="selectedOrder.deliveryFee">
                <span class="label">Taxa de entrega:</span>
                <span class="value">{{ formatCurrency(selectedOrder.deliveryFee) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total:</span>
                <span class="value total">{{ formatCurrency(selectedOrder.total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação -->
    <div v-if="confirmationModal.show" class="confirmation-overlay" @click="cancelConfirmation">
      <div class="modal-content confirmation-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ confirmationModal.title }}</h3>
          <button @click="cancelConfirmation" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>{{ confirmationModal.message }}</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelConfirmation" class="btn-cancel-modal">
            Cancelar
          </button>
          <button @click="executeConfirmedAction" class="btn-confirm-modal">
            Confirmar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Edição de Status -->
    <div v-if="showStatusModal" class="status-overlay" @click="closeStatusModal">
      <div class="modal-content status-modal" @click.stop>
        <div class="modal-header">
          <h3>Editar Status do Pedido</h3>
          <button @click="closeStatusModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Status Atual:</label>
            <span class="current-status">{{ getStatusText(orderToUpdate?.status) }}</span>
          </div>
          <div class="form-group">
            <label for="newStatus">Novo Status:</label>
            <select id="newStatus" v-model="newStatus" class="status-select">
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="preparing">Preparando</option>
              <option value="ready">Pronto</option>
              <option value="out_for_delivery">Saiu para entrega</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeStatusModal" class="btn-cancel-modal">
            Cancelar
          </button>
          <button @click="saveStatusEdit" class="btn-confirm-modal">
            Salvar Alteração
          </button>
        </div>
      </div>
    </div>

    <!-- Alert -->
    <Alert 
      :show="alert.show" 
      :type="alert.type" 
      :message="alert.message"
      @close="alert.show = false"
    />

    <!-- Componente de Notificações -->
    <OrderNotifications
      :notifications="notifications"
      @view-order="viewOrderFromNotification"
      @mark-read="markAsRead"
      @clear-all="clearNotifications"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Alert from '~/components/Alert.vue'
import OrderNotifications from '~/components/OrderNotifications.vue'
import { useAlert } from '~/composables/useAlert'

// Definir layout
definePageMeta({
  layout: 'dashboard'
})

// Composable de alert
const { alert, showSuccess, showError, showWarning, showInfo } = useAlert()

// Estado da página
const loading = ref(false)
const orders = ref([])
const statusFilter = ref('')
const selectedOrder = ref(null)
const showStatusModal = ref(false)
const orderToUpdate = ref(null)
const newStatus = ref('')
const confirmationModal = ref({
  show: false,
  title: '',
  message: '',
  action: null
})

// Sistema de notificações em tempo real
const {
  notifications,
  startNotifications,
  stopNotifications,
  markAsRead,
  clearAll: clearNotifications,
  playNotificationSound,
  setOnNewOrderCallback
} = useOrderNotifications()

const syncEnabled = ref(true)

// Callback para atualizar lista imediatamente quando novo pedido chegar
setOnNewOrderCallback((order) => {
  console.log('[Orders] Callback executado - recarregando lista imediatamente...', order?.orderNumber || order?._id)
  // Usar nextTick para garantir que a atualização aconteça após o Vue processar a notificação
  nextTick(() => {
    loadOrders(false, true)
  })
})

// Watcher adicional como fallback
watch(notifications, (newNotifs, oldNotifs) => {
  const unreadCount = newNotifs.filter(n => !n.read).length
  const hasNewNotifications = newNotifs.length > (oldNotifs?.length || 0)
  
  // Se há notificações não lidas OU há novas notificações, atualizar
  if (hasNewNotifications && unreadCount > 0) {
    console.log('[Orders] Watcher detectou nova notificação, recarregando lista...')
    loadOrders(false, true)
  }
}, { deep: true, immediate: false })

// Função para ver pedido da notificação
const viewOrderFromNotification = (order) => {
  // Mapear para o formato esperado
  const mappedOrder = {
    id: order.orderNumber,
    _id: order._id,
    customer: order.customerInfo?.name,
    phone: order.customerInfo?.phone,
    email: order.customerInfo?.email,
    address: order.deliveryInfo?.address,
    number: order.deliveryInfo?.number || '',
    neighborhood: order.deliveryInfo?.neighborhood,
    city: order.deliveryInfo?.city,
    zipCode: order.deliveryInfo?.zipCode,
    complement: order.deliveryInfo?.complement,
    status: order.status,
    total: order.totalAmount,
    subtotal: order.totalAmount - (order.deliveryInfo?.deliveryFee || 0),
    deliveryFee: order.deliveryInfo?.deliveryFee,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    createdAt: order.createdAt,
    items: order.items?.map(item => ({
      id: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      complements: item.complements || []
    })) || []
  }
  
  viewOrderDetails(mappedOrder)
}

// Função para testar som
const testSound = () => {
  playNotificationSound()
}

// Funções
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    out_for_delivery: 'Saiu para entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  }
  return statusMap[status] || status
}

const { authenticatedFetch, clearCache } = useAuthenticatedFetch()

const loadOrders = async (showLoading = true, forceRefresh = false) => {
  try {
    if (showLoading) {
      loading.value = true
    }
    
    // Limpar cache se for refresh forçado (quando nova notificação chega)
    if (forceRefresh) {
      clearCache('/api/orders')
    }
    
    const url = statusFilter.value 
      ? `/api/orders?status=${statusFilter.value}&page=1&limit=100&_t=${Date.now()}`
      : `/api/orders?page=1&limit=100&_t=${Date.now()}`
    
    // Forçar busca sem cache usando query param único
    const response = await authenticatedFetch(url, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    // Adaptar para nova estrutura de resposta com paginação
    const ordersData = response.orders || response
    
    if (!Array.isArray(ordersData)) {
      console.error('[Orders] Resposta inválida:', response)
      return
    }
    
    orders.value = ordersData.map(order => {
      // Validação e tratamento seguro dos dados
      const customerInfo = order.customerInfo || {}
      const deliveryInfo = order.deliveryInfo || {}
      const items = order.items || []
      
      return {
        id: order.orderNumber || order._id?.toString() || 'N/A',
        _id: order._id,
        customer: customerInfo.name || 'Cliente não informado',
        phone: customerInfo.phone || '',
        email: customerInfo.email || '',
        address: deliveryInfo.address || '',
        number: deliveryInfo.number || '',
        neighborhood: deliveryInfo.neighborhood || '',
        city: deliveryInfo.city || '',
        zipCode: deliveryInfo.zipCode || '',
        complement: deliveryInfo.complement || '',
        status: order.status || 'pending',
        total: order.totalAmount || 0,
        subtotal: (order.totalAmount || 0) - (deliveryInfo.deliveryFee || 0),
        deliveryFee: deliveryInfo.deliveryFee || 0,
        paymentMethod: order.paymentMethod || 'dinheiro',
        notes: order.notes || '',
        createdAt: order.createdAt || new Date(),
        items: items.map(item => ({
          id: item.productId || item._id?.toString() || '',
          name: item.name || 'Produto sem nome',
          quantity: item.quantity || 0,
          price: item.price || 0,
          subtotal: item.subtotal || 0,
          complements: item.complements || []
        }))
      }
    })
    
    console.log('[Orders] Lista atualizada:', orders.value.length, 'pedidos')
    
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error)
    const errorMessage = error.data?.message || error.message || 'Erro ao carregar pedidos'
    showAlert(errorMessage, 'error')
  } finally {
    if (showLoading) {
      loading.value = false
    }
  }
}

const refreshOrders = () => {
  console.log('[Orders] Atualização manual acionada')
  loadOrders(true, true) // Mostrar loading e forçar refresh
}

// Função para mostrar modal de confirmação
const showConfirmation = (title, message, action) => {
  confirmationModal.value = {
    show: true,
    title,
    message,
    action
  }
}

// Função para executar ação confirmada
const executeConfirmedAction = async () => {
  if (confirmationModal.value.action) {
    await confirmationModal.value.action()
  }
  confirmationModal.value.show = false
}

// Função para cancelar confirmação
const cancelConfirmation = () => {
  confirmationModal.value.show = false
}

// Função para mostrar modal de edição de status
const showEditStatusModal = (order) => {
  orderToUpdate.value = order
  newStatus.value = order.status
  showStatusModal.value = true
}

// Função para fechar modal de edição de status
const closeStatusModal = () => {
  showStatusModal.value = false
  orderToUpdate.value = null
  newStatus.value = ''
}

// Função para executar a atualização de status
const performStatusUpdate = async (orderId, newStatus) => {
  try {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      console.error('Pedido não encontrado:', orderId)
      showAlert('Pedido não encontrado', 'error')
      return
    }
    
    
    const response = await authenticatedFetch(`/api/orders/${order._id}`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    
    
    // Atualizar status localmente
    order.status = newStatus
    showAlert(`Status do pedido #${orderId} atualizado para ${getStatusText(newStatus)}`, 'success')
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    const errorMessage = error.data?.message || error.message || 'Erro ao atualizar status do pedido'
    showAlert(errorMessage, 'error')
  }
}

// Função para salvar status editado
const saveStatusEdit = async () => {
  if (!orderToUpdate.value || !newStatus.value) return
  
  const orderId = orderToUpdate.value.id
  const currentStatusText = getStatusText(orderToUpdate.value.status)
  const newStatusText = getStatusText(newStatus.value)
  
  const title = 'Confirmar Alteração de Status'
  const message = `Deseja realmente alterar o status do pedido #${orderId} de "${currentStatusText}" para "${newStatusText}"?`
  
  showConfirmation(title, message, async () => {
    await performStatusUpdate(orderId, newStatus.value)
    closeStatusModal()
  })
}

const viewOrderDetails = (order) => {
  selectedOrder.value = order
}

const closeOrderModal = () => {
  selectedOrder.value = null
}

const showAlert = (message, type = 'success') => {
  if (type === 'success') {
    showSuccess(message)
  } else if (type === 'error') {
    showError(message)
  } else if (type === 'warning') {
    showWarning(message)
  } else {
    showInfo(message)
  }
}

// Lifecycle
onMounted(() => {
  loadOrders()
  // Iniciar notificações em tempo real automaticamente
  if (process.client) {
    // Aguardar um pouco para garantir que a página está completamente carregada
    setTimeout(() => {
      console.log('[Orders Page] Iniciando notificações...')
      startNotifications()
    }, 500)
  }
})

onUnmounted(() => {
  // Parar notificações quando componente for desmontado
  stopNotifications()
})
</script>

<style scoped>
.orders-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  flex: 1;
}

.header-left h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
}

.page-description {
  color: #6b7280;
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.new-orders-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #FF6B35 0%, #ff8e24 100%);
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
  animation: pulse 2s infinite;
}

.new-orders-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
}

.badge-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: 700;
  min-width: 1.5rem;
  text-align: center;
}

.badge-text {
  text-transform: lowercase;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.btn-sync-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  min-width: 44px;
}

.btn-sync-toggle:hover {
  background: #f3f4f6;
  border-color: #ff8e24;
  color: #ff8e24;
}

.btn-sync-toggle.active {
  background: #ff8e24;
  border-color: #ff8e24;
  color: white;
}

.btn-sync-toggle.active:hover {
  background: #e67e22;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.filter-select {
  padding: 0.75rem 1rem;
  padding-right: calc(1rem + 1.5rem); /* Espaço extra para a setinha */
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  min-height: 44px; /* Touch-friendly */
}

.filter-select:focus {
  outline: none;
  border-color: #ff8e24;
  box-shadow: 0 0 0 3px rgba(255, 142, 36, 0.1);
}

.btn-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  min-height: 44px;
  flex-shrink: 0;
}

.btn-refresh:hover:not(:disabled) {
  background: #e2e8f0;
  color: #334155;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-refresh:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.empty-state svg {
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #475569;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.order-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #ff8e24;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.order-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.order-date {
  font-size: 0.875rem;
  color: #64748b;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.confirmed {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.preparing {
  background: #fde68a;
  color: #b45309;
}

.status-badge.ready {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.out_for_delivery {
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge.delivered {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.order-details {
  margin-bottom: 1rem;
}

.customer-info {
  margin-bottom: 0.75rem;
}

.customer-info strong {
  display: block;
  color: #1e293b;
  font-size: 0.875rem;
}

.customer-info span {
  color: #64748b;
  font-size: 0.75rem;
}

.order-items {
  margin-bottom: 0.75rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.item-quantity {
  color: #64748b;
  margin-right: 0.5rem;
}

.item-name {
  flex: 1;
  color: #1e293b;
}

.item-price {
  color: #1e293b;
  font-weight: 500;
}

.order-total {
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  text-align: right;
  color: #1e293b;
}

.order-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.order-actions button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view {
  background: white;
  color: #6b7280;
  border-color: #6b7280;
}

.btn-view:hover {
  background: #6b7280;
  color: white;
}

.btn-edit {
  background: white;
  color: #ff8e24;
  border-color: #ff8e24;
}

.btn-edit:hover {
  background: #ff8e24;
  color: white;
}

/* Modal */
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
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.modal-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  color: #64748b;
  font-size: 0.875rem;
}

.detail-row .value {
  font-weight: 500;
  color: #1e293b;
}

.detail-row .value.total {
  font-size: 1.125rem;
  font-weight: 700;
}

.order-item-full {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.order-item-full:last-child {
  margin-bottom: 0;
}

.item-info {
  flex: 1;
}

.item-complements {
  margin-top: 0.5rem;
}

.complement {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

/* Modal de Confirmação e Edição de Status */
.confirmation-modal,
.status-modal {
  max-width: 500px;
}

/* Overlay específico para modal de confirmação */
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
  padding: 1rem;
}

/* Overlay específico para modal de edição de status */
.status-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-cancel-modal {
  padding: 0.5rem 1rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel-modal:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-confirm-modal {
  padding: 0.5rem 1rem;
  background: #ff8e24;
  color: white;
  border: 1px solid #ff8e24;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm-modal:hover {
  background: #e67e22;
  border-color: #e67e22;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.current-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-select {
  width: 100%;
  padding: 0.5rem;
  padding-right: calc(0.5rem + 1.5rem); /* Espaço extra para a setinha */
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
}

.status-select:focus {
  outline: none;
  border-color: #ff8e24;
  box-shadow: 0 0 0 3px rgba(255, 142, 36, 0.1);
}

/* Alert */
.alert {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 400px;
}

.alert.success {
  background: #10b981;
}

.alert.error {
  background: #ef4444;
}

.alert-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

/* Responsividade */
@media (max-width: 1024px) {
  .orders-page {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .orders-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .header-left h1 {
    font-size: 1.5rem;
  }
  
  .filter-select {
    width: 100%;
    padding: 0.875rem 1rem;
    padding-right: calc(1rem + 1.5rem);
  }
  
  .btn-refresh {
    width: 100%;
    padding: 0.875rem 1rem;
    justify-content: center;
  }
  
  .orders-grid {
    grid-template-columns: 1fr;
  }
  
  .order-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .order-actions button {
    width: 100%;
    padding: 0.875rem 1rem;
    min-height: 44px;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .orders-page {
    padding: 0.75rem;
  }
}
</style>
