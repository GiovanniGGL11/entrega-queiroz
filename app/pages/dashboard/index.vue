<template>
  <div class="dashboard-home">
    <!-- Estatísticas Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalOrders }}</h3>
          <p>Total de Pedidos</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <h3>{{ stats.pendingOrders }}</h3>
          <p>Pedidos Pendentes</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(stats.totalRevenue) }}</h3>
          <p>Receita Total</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3h18l-2 14H5L3 3z"></path>
            <path d="M8 21h8"></path>
          </svg>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalProducts }}</h3>
          <p>Produtos Ativos</p>
        </div>
      </div>
    </div>

    <!-- Gráficos e Tabelas -->
    <div class="dashboard-content">
      <!-- Pedidos Recentes -->
      <div class="content-card">
        <div class="card-header">
          <h2>Pedidos Recentes</h2>
          <button @click="refreshOrders" class="btn-refresh" :disabled="loadingOrders">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            {{ loadingOrders ? 'Carregando...' : 'Atualizar' }}
          </button>
        </div>
        <div class="orders-table">
          <div v-if="loadingOrders" class="loading">
            <p>Carregando pedidos...</p>
          </div>
          <div v-else-if="recentOrders.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            <h3>Nenhum pedido encontrado</h3>
            <p>Os pedidos aparecerão aqui quando forem feitos</p>
          </div>
          <div v-else class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.id">
                  <td>#{{ order.id }}</td>
                  <td>{{ order.customer }}</td>
                  <td>
                    <span class="status-badge" :class="order.status">
                      {{ getStatusText(order.status) }}
                    </span>
                  </td>
                  <td>{{ formatCurrency(order.total) }}</td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <button @click="viewOrder(order)" class="btn-view">
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Resumo de Vendas -->
      <div class="content-card">
        <div class="card-header">
          <h2>Resumo de Vendas</h2>
          <div class="period-selector">
            <select v-model="selectedPeriod" @change="loadSalesData">
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
            </select>
          </div>
        </div>
        <div class="sales-summary">
          <div class="sales-item">
            <span class="sales-label">Vendas:</span>
            <span class="sales-value">{{ formatCurrency(salesData.total) }}</span>
          </div>
          <div class="sales-item">
            <span class="sales-label">Pedidos:</span>
            <span class="sales-value">{{ salesData.orders }}</span>
          </div>
          <div class="sales-item">
            <span class="sales-label">Ticket Médio:</span>
            <span class="sales-value">{{ formatCurrency(salesData.averageTicket) }}</span>
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
          <div class="order-details">
            <div class="detail-row">
              <span class="label">Cliente:</span>
              <span class="value">{{ selectedOrder.customer }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="status-badge" :class="selectedOrder.status">
                {{ getStatusText(selectedOrder.status) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Total:</span>
              <span class="value">{{ formatCurrency(selectedOrder.total) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Data:</span>
              <span class="value">{{ formatDate(selectedOrder.createdAt) }}</span>
            </div>
          </div>
          <div class="order-items">
            <h4>Itens do Pedido</h4>
            <div v-for="item in selectedOrder.items" :key="item.id" class="order-item">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-quantity">x{{ item.quantity }}</span>
              <span class="item-price">{{ formatCurrency(item.price) }}</span>
            </div>
          </div>
        </div>
      </div>
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
const loadingOrders = ref(false)
const selectedPeriod = ref('today')
const selectedOrder = ref(null)

// Estatísticas (mock data - será substituído por API)
const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  totalRevenue: 0,
  totalProducts: 0
})

// Dados de vendas
const salesData = ref({
  total: 0,
  orders: 0,
  averageTicket: 0
})

// Pedidos recentes (mock data - será substituído por API)
const recentOrders = ref([])

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

const loadStats = async () => {
  try {
    // TODO: Substituir por chamada real da API
    // const response = await $fetch('/api/dashboard/stats')
    
    // Mock data
    stats.value = {
      totalOrders: 156,
      pendingOrders: 8,
      totalRevenue: 12450.80,
      totalProducts: 24
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
  }
}

const loadOrders = async () => {
  try {
    loadingOrders.value = true
    // TODO: Substituir por chamada real da API
    // const response = await $fetch('/api/orders/recent')
    
    // Mock data
    recentOrders.value = [
      {
        id: '001',
        customer: 'João Silva',
        status: 'pending',
        total: 45.50,
        createdAt: new Date().toISOString(),
        items: [
          { id: 1, name: 'Hamburger Artesanal', quantity: 1, price: 28.00 },
          { id: 2, name: 'Batata Frita', quantity: 1, price: 12.00 },
          { id: 3, name: 'Coca-Cola', quantity: 1, price: 5.50 }
        ]
      },
      {
        id: '002',
        customer: 'Maria Santos',
        status: 'preparing',
        total: 32.00,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        items: [
          { id: 1, name: 'Cheese Burger', quantity: 1, price: 25.00 },
          { id: 2, name: 'Suco Natural', quantity: 1, price: 7.00 }
        ]
      },
      {
        id: '003',
        customer: 'Pedro Costa',
        status: 'delivered',
        total: 67.50,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        items: [
          { id: 1, name: 'Duplo Bacon', quantity: 1, price: 35.00 },
          { id: 2, name: 'Batata Frita Grande', quantity: 1, price: 18.00 },
          { id: 3, name: 'Coca-Cola 2L', quantity: 1, price: 14.50 }
        ]
      }
    ]
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error)
  } finally {
    loadingOrders.value = false
  }
}

const loadSalesData = async () => {
  try {
    // TODO: Substituir por chamada real da API
    // const response = await $fetch(`/api/dashboard/sales?period=${selectedPeriod.value}`)
    
    // Mock data baseado no período
    const mockData = {
      today: { total: 450.80, orders: 12, averageTicket: 37.57 },
      week: { total: 3240.50, orders: 89, averageTicket: 36.41 },
      month: { total: 12450.80, orders: 356, averageTicket: 34.97 },
      year: { total: 145680.20, orders: 4156, averageTicket: 35.05 }
    }
    
    salesData.value = mockData[selectedPeriod.value] || mockData.today
  } catch (error) {
    console.error('Erro ao carregar dados de vendas:', error)
  }
}

const refreshOrders = () => {
  loadOrders()
}

const viewOrder = (order) => {
  selectedOrder.value = order
}

const closeOrderModal = () => {
  selectedOrder.value = null
}

// Lifecycle
onMounted(() => {
  loadStats()
  loadOrders()
  loadSalesData()
})
</script>

<style scoped>
.dashboard-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-content h3 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-content p {
  margin: 0.25rem 0 0 0;
  color: #64748b;
  font-size: 0.875rem;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.content-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
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

.period-selector select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
}

.orders-table {
  padding: 1.5rem;
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

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
}

td {
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

.btn-view {
  padding: 0.375rem 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-view:hover {
  background: #5a67d8;
}

.sales-summary {
  padding: 1.5rem;
}

.sales-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.sales-item:last-child {
  border-bottom: none;
}

.sales-label {
  color: #64748b;
  font-size: 0.875rem;
}

.sales-value {
  font-weight: 600;
  color: #1e293b;
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
  max-width: 500px;
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

.order-details {
  margin-bottom: 1.5rem;
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

.order-items h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.order-item:last-child {
  margin-bottom: 0;
}

.item-name {
  flex: 1;
  color: #1e293b;
  font-weight: 500;
}

.item-quantity {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 1rem;
}

.item-price {
  color: #1e293b;
  font-weight: 600;
}

/* Responsividade */
@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .table-container {
    font-size: 0.875rem;
  }
  
  th, td {
    padding: 0.5rem;
  }
}
</style>