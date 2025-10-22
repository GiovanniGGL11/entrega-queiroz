<template>
  <div class="dashboard-home">
    <!-- Skeleton Loading -->
    <div v-if="loading" class="skeleton-container">
      <!-- Skeleton para Cards de Estatísticas -->
      <div class="stats-grid">
        <div v-for="i in 4" :key="i" class="stat-card skeleton-card">
          <div class="stat-icon skeleton-icon"></div>
          <div class="stat-content">
            <div class="skeleton-text skeleton-title"></div>
            <div class="skeleton-text skeleton-subtitle"></div>
          </div>
        </div>
      </div>

      <!-- Skeleton para Cards de Conteúdo -->
      <div class="dashboard-content">
        <!-- Skeleton para Pedidos Recentes -->
        <div class="card skeleton-card">
          <div class="card-header">
            <div class="skeleton-text skeleton-header"></div>
            <div class="skeleton-button"></div>
          </div>
          <div class="card-body">
            <div v-for="i in 5" :key="i" class="order-item skeleton-order">
              <div class="skeleton-text skeleton-customer"></div>
              <div class="skeleton-text skeleton-status"></div>
              <div class="skeleton-text skeleton-total"></div>
            </div>
          </div>
        </div>

        <!-- Skeleton para Resumo de Vendas -->
        <div class="card skeleton-card">
          <div class="card-header">
            <div class="skeleton-text skeleton-header"></div>
            <div class="skeleton-select"></div>
          </div>
          <div class="card-body">
            <div class="sales-summary">
              <div v-for="i in 3" :key="i" class="sales-item">
                <div class="skeleton-text skeleton-sales-label"></div>
                <div class="skeleton-text skeleton-sales-value"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo Real -->
    <div v-else>
      <!-- Header do Dashboard -->
      <div class="page-header">
        <h1>Dashboard</h1>
        <div class="header-actions">
          <button @click="refreshOrders" class="btn-refresh" :disabled="loadingOrders">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            {{ loadingOrders ? 'Carregando...' : 'Atualizar' }}
          </button>
        </div>
      </div>

      <!-- Estatísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ formatCurrency(stats.basic.totalRevenue) }}</h3>
            <p>Receita Total</p>
            <small>{{ stats.basic.totalOrders }} pedidos</small>
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
            <h3>{{ stats.basic.pendingOrders }}</h3>
            <p>Pedidos Pendentes</p>
            <small>{{ ((stats.basic.pendingOrders / stats.basic.totalOrders) * 100).toFixed(1) }}% do total</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"></path>
              <path d="M9 9l3 3 3-3"></path>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ formatCurrency(stats.basic.averageTicket) }}</h3>
            <p>Ticket Médio</p>
            <small>por pedido</small>
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
            <h3>{{ stats.basic.totalProducts }}</h3>
            <p>Produtos Ativos</p>
            <small>{{ stats.insights.topSellingItems.length }} categorias</small>
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
            <select v-model="selectedPeriod" class="period-select">
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
            <span class="sales-value">{{ formatCurrency(currentPeriodData.revenue) }}</span>
          </div>
          <div class="sales-item">
            <span class="sales-label">Pedidos:</span>
            <span class="sales-value">{{ currentPeriodData.orders }}</span>
          </div>
          <div class="sales-item">
            <span class="sales-label">Ticket Médio:</span>
            <span class="sales-value">{{ formatCurrency(currentPeriodData.averageTicket) }}</span>
          </div>
          <div v-if="currentPeriodData.growth !== undefined" class="sales-item">
            <span class="sales-label">Crescimento:</span>
            <span class="sales-value" :class="currentPeriodData.growth >= 0 ? 'positive' : 'negative'">
              {{ currentPeriodData.growth >= 0 ? '+' : '' }}{{ currentPeriodData.growth.toFixed(1) }}%
            </span>
          </div>
        </div>
        
        <!-- Top 5 Itens Mais Vendidos -->
        <div class="top-items">
          <h4>Top 5 Itens Mais Vendidos</h4>
          <div class="items-list">
            <div v-for="(item, index) in stats.insights.topSellingItems" :key="item.name" class="item-row">
              <div class="item-rank">{{ index + 1 }}º</div>
              <div class="item-name">{{ item.name }}</div>
              <div class="item-quantity">{{ item.quantity }} vendas</div>
            </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Definir layout
definePageMeta({
  layout: 'dashboard'
})

// Estado da página
const loading = ref(true)
const loadingOrders = ref(false)
const selectedPeriod = ref('today')
const selectedOrder = ref(null)

// Estatísticas reais
const stats = ref({
  basic: {
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    averageTicket: 0
  },
  periods: {
    today: { orders: 0, revenue: 0, averageTicket: 0 },
    week: { orders: 0, revenue: 0, averageTicket: 0, growth: 0 },
    month: { orders: 0, revenue: 0, averageTicket: 0, growth: 0 },
    year: { orders: 0, revenue: 0, averageTicket: 0 }
  },
  insights: {
    mostSoldItem: { name: 'Nenhum', quantity: 0 },
    topSellingItems: []
  }
})

// Dados do período atual selecionado
const currentPeriodData = computed(() => {
  return stats.value.periods[selectedPeriod.value] || stats.value.periods.today
})

// Pedidos recentes
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

const { authenticatedFetch } = useAuthenticatedFetch()

const loadStats = async () => {
  try {
    // Carregar estatísticas reais da API
    const response = await authenticatedFetch('/api/dashboard/stats')
    stats.value = response
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
    // Fallback para dados vazios em caso de erro
    stats.value = {
      basic: {
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        averageTicket: 0
      },
      periods: {
        today: { orders: 0, revenue: 0, averageTicket: 0 },
        week: { orders: 0, revenue: 0, averageTicket: 0, growth: 0 },
        month: { orders: 0, revenue: 0, averageTicket: 0, growth: 0 },
        year: { orders: 0, revenue: 0, averageTicket: 0 }
      },
      insights: {
        mostSoldItem: { name: 'Nenhum', quantity: 0 },
        topSellingItems: []
      }
    }
  } finally {
    loading.value = false
  }
}

const loadOrders = async () => {
  try {
    loadingOrders.value = true
    
    const response = await authenticatedFetch('/api/orders?page=1&limit=5')
    
    // Adaptar para nova estrutura de resposta com paginação
    const ordersData = response.orders || response
    
    // Pegar apenas os últimos 5 pedidos
    recentOrders.value = ordersData
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(order => ({
        id: order.orderNumber,
        customer: order.customerInfo.name,
        status: order.status,
        total: order.totalAmount,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      }))
  } catch (error) {
    console.error('Erro ao carregar pedidos recentes:', error)
    recentOrders.value = []
  } finally {
    loadingOrders.value = false
  }
}

const refreshOrders = async () => {
  await Promise.all([
    loadStats(),
    loadOrders()
  ])
}

const viewOrder = (order) => {
  selectedOrder.value = order
}

const closeOrderModal = () => {
  selectedOrder.value = null
}

// Lifecycle
onMounted(async () => {
  // Aguardar um pouco para garantir que a autenticação seja verificada
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    await Promise.all([
      loadStats(),
      loadOrders()
    ])
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error)
  }
})
</script>

<style scoped>
.dashboard-home {
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

.page-header h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
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

.stat-content small {
  display: block;
  margin-top: 0.25rem;
  color: #94a3b8;
  font-size: 0.75rem;
}

.positive {
  color: #059669;
}

.negative {
  color: #dc2626;
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

.period-selector {
  position: relative;
}

.period-select {
  padding: 0.5rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
}

.period-select:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
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
  background: #f97316;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-view:hover {
  background: #ea580c;
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

/* Top Items Styles */
.top-items {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.top-items h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  gap: 1rem;
}

.item-rank {
  width: 2rem;
  height: 2rem;
  background: #f97316;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.item-name {
  flex: 1;
  color: #1e293b;
  font-weight: 500;
  font-size: 0.875rem;
}

.item-quantity {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
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
@media (max-width: 1024px) {
  .dashboard-home {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .dashboard-home {
    padding: 1rem;
  }
  
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .table-container {
    font-size: 0.875rem;
  }
  
  th, td {
    padding: 0.5rem;
  }
}

@media (max-width: 640px) {
  .dashboard-home {
    padding: 0.75rem;
  }
}

/* Skeleton Loading Styles */
.skeleton-container {
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

.skeleton-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.skeleton-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 0.75rem;
}

.skeleton-text {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 0.25rem;
  height: 1rem;
}

.skeleton-title {
  width: 60px;
  height: 1.5rem;
  margin-bottom: 0.5rem;
}

.skeleton-subtitle {
  width: 100px;
  height: 0.875rem;
}

.skeleton-header {
  width: 120px;
  height: 1.25rem;
}

.skeleton-button {
  width: 80px;
  height: 2rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 0.375rem;
}

.skeleton-select {
  width: 100px;
  height: 2rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 0.375rem;
}

.skeleton-order {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.skeleton-customer {
  width: 120px;
  height: 1rem;
}

.skeleton-status {
  width: 80px;
  height: 1.5rem;
  border-radius: 0.75rem;
}

.skeleton-total {
  width: 60px;
  height: 1rem;
}

.skeleton-sales-label {
  width: 80px;
  height: 1rem;
  margin-bottom: 0.25rem;
}

.skeleton-sales-value {
  width: 100px;
  height: 1.25rem;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>