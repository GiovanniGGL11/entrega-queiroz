<template>
  <div class="orders-page">
    <div class="page-header">
      <h1>Gerenciar Pedidos</h1>
      <div class="header-actions">
        <select v-model="statusFilter" @change="loadOrders" class="filter-select">
          <option value="">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="confirmed">Confirmados</option>
          <option value="preparing">Preparando</option>
          <option value="ready">Prontos</option>
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
              v-if="order.status === 'pending'" 
              @click="updateOrderStatus(order.id, 'confirmed')" 
              class="btn-confirm"
            >
              Confirmar
            </button>
            <button 
              v-if="order.status === 'confirmed'" 
              @click="updateOrderStatus(order.id, 'preparing')" 
              class="btn-prepare"
            >
              Preparar
            </button>
            <button 
              v-if="order.status === 'preparing'" 
              @click="updateOrderStatus(order.id, 'ready')" 
              class="btn-ready"
            >
              Pronto
            </button>
            <button 
              v-if="order.status === 'ready'" 
              @click="updateOrderStatus(order.id, 'delivered')" 
              class="btn-deliver"
            >
              Entregue
            </button>
            <button 
              v-if="['pending', 'confirmed'].includes(order.status)" 
              @click="updateOrderStatus(order.id, 'cancelled')" 
              class="btn-cancel"
            >
              Cancelar
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
                <span class="value">{{ selectedOrder.address }}</span>
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

    <!-- Alert -->
    <div v-if="alert.show" class="alert" :class="alert.type">
      <p>{{ alert.message }}</p>
      <button @click="alert.show = false" class="alert-close">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Definir layout
definePageMeta({
  layout: 'dashboard'
})

// Estado da página
const loading = ref(false)
const orders = ref([])
const statusFilter = ref('')
const selectedOrder = ref(null)

// Alert
const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

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
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  }
  return statusMap[status] || status
}

const loadOrders = async () => {
  try {
    loading.value = true
    // TODO: Substituir por chamada real da API
    // const url = statusFilter.value 
    //   ? `/api/orders?status=${statusFilter.value}`
    //   : '/api/orders'
    // const response = await $fetch(url)
    
    // Mock data
    orders.value = [
      {
        id: '001',
        customer: 'João Silva',
        phone: '(11) 99999-9999',
        address: 'Rua das Flores, 123 - Centro',
        status: 'pending',
        total: 45.50,
        subtotal: 40.50,
        deliveryFee: 5.00,
        createdAt: new Date().toISOString(),
        items: [
          { id: 1, name: 'Hamburger Artesanal', quantity: 1, price: 28.00, complements: [] },
          { id: 2, name: 'Batata Frita', quantity: 1, price: 12.00, complements: [] },
          { id: 3, name: 'Coca-Cola', quantity: 1, price: 5.50, complements: [] }
        ]
      },
      {
        id: '002',
        customer: 'Maria Santos',
        phone: '(11) 88888-8888',
        status: 'preparing',
        total: 32.00,
        subtotal: 32.00,
        deliveryFee: 0,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        items: [
          { id: 1, name: 'Cheese Burger', quantity: 1, price: 25.00, complements: [] },
          { id: 2, name: 'Suco Natural', quantity: 1, price: 7.00, complements: [] }
        ]
      },
      {
        id: '003',
        customer: 'Pedro Costa',
        phone: '(11) 77777-7777',
        status: 'delivered',
        total: 67.50,
        subtotal: 67.50,
        deliveryFee: 0,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        items: [
          { id: 1, name: 'Duplo Bacon', quantity: 1, price: 35.00, complements: [] },
          { id: 2, name: 'Batata Frita Grande', quantity: 1, price: 18.00, complements: [] },
          { id: 3, name: 'Coca-Cola 2L', quantity: 1, price: 14.50, complements: [] }
        ]
      }
    ]
    
    // Filtrar por status se necessário
    if (statusFilter.value) {
      orders.value = orders.value.filter(order => order.status === statusFilter.value)
    }
  } catch (error) {
    showAlert('Erro ao carregar pedidos', 'error')
  } finally {
    loading.value = false
  }
}

const refreshOrders = () => {
  loadOrders()
}

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    // TODO: Substituir por chamada real da API
    // await $fetch(`/api/orders/${orderId}`, {
    //   method: 'PUT',
    //   body: { status: newStatus }
    // })
    
    // Mock update
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = newStatus
      showAlert(`Status do pedido #${orderId} atualizado para ${getStatusText(newStatus)}`, 'success')
    }
  } catch (error) {
    showAlert('Erro ao atualizar status do pedido', 'error')
  }
}

const viewOrderDetails = (order) => {
  selectedOrder.value = order
}

const closeOrderModal = () => {
  selectedOrder.value = null
}

const showAlert = (message, type = 'success') => {
  alert.value = {
    show: true,
    type,
    message
  }
  setTimeout(() => {
    alert.value.show = false
  }, 5000)
}

// Lifecycle
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-page {
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

.page-header h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  gap: 0.5rem;
  flex-wrap: wrap;
}

.order-actions button {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm {
  background: #3b82f6;
  color: white;
}

.btn-confirm:hover {
  background: #2563eb;
}

.btn-prepare {
  background: #f59e0b;
  color: white;
}

.btn-prepare:hover {
  background: #d97706;
}

.btn-ready {
  background: #10b981;
  color: white;
}

.btn-ready:hover {
  background: #059669;
}

.btn-deliver {
  background: #8b5cf6;
  color: white;
}

.btn-deliver:hover {
  background: #7c3aed;
}

.btn-cancel {
  background: #ef4444;
  color: white;
}

.btn-cancel:hover {
  background: #dc2626;
}

.btn-view {
  background: #6b7280;
  color: white;
}

.btn-view:hover {
  background: #4b5563;
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
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .orders-grid {
    grid-template-columns: 1fr;
  }
  
  .order-actions {
    flex-direction: column;
  }
  
  .order-actions button {
    width: 100%;
  }
}
</style>

