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
        <div class="content-card skeleton-card">
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
        <div class="content-card skeleton-card">
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
        <div class="header-left">
          <h1>Dashboard</h1>
        </div>
        <div class="header-actions">
          <button 
            @click="refreshOrders" 
            class="btn-refresh" 
            :disabled="loadingOrders"
            title="Atualizar lista de pedidos"
          >
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
          <div class="stat-icon" title="Receita total gerada">
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
          <div class="stat-icon" title="Pedidos aguardando processamento">
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
          <div class="stat-icon" title="Valor médio por pedido">
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
          <div class="stat-icon" title="Produtos cadastrados no sistema">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3h18l-2 14H5L3 3z"></path>
              <path d="M8 21h8"></path>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ stats.basic.totalProducts }}</h3>
            <p>Produtos Ativos</p>
            <small>{{ stats.basic.totalCategories }} categorias</small>
          </div>
        </div>
      </div>

    <!-- Gráficos e Tabelas -->
    <div class="dashboard-content">
      <!-- Gráficos -->
      <div class="charts-grid">
        <!-- Gráfico de Vendas por Período -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Vendas por Período</h3>
          </div>
          <DashboardChart 
            type="bar"
            :data="salesChartData"
            :options="salesChartOptions"
          />
        </div>

        <!-- Gráfico de Ticket Médio -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Ticket Médio por Período</h3>
          </div>
          <DashboardChart 
            type="line"
            :data="ticketChartData"
            :options="ticketChartOptions"
          />
        </div>

        <!-- Gráfico de Produtos Mais Vendidos -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Top 5 Produtos Mais Vendidos</h3>
          </div>
          <DashboardChart 
            type="doughnut"
            :data="productsChartData"
            :options="productsChartOptions"
          />
        </div>
      </div>

      <!-- Pedidos Recentes -->
      <div class="content-card orders-full-width">
        <div class="card-header">
          <h2>Pedidos Recentes</h2>
          <button 
            @click="refreshOrders" 
            class="btn-refresh" 
            :disabled="loadingOrders"
            title="Atualizar lista de pedidos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            {{ loadingOrders ? 'Carregando...' : 'Atualizar' }}
          </button>
        </div>
        <div class="orders-grid-container">
          <div v-if="loadingOrders" class="loading">
            <p>Carregando pedidos...</p>
          </div>
          <div v-else-if="recentOrders.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M16 11V7a4 4 0 0 0-8 0v4"></path>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              </svg>
            </div>
            <h3>Nenhum pedido recente</h3>
            <p>Os pedidos aparecerão aqui quando forem feitos pelos seus clientes</p>
            <div class="empty-tips">
              <div class="tip-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <span>Configure seus produtos no menu</span>
              </div>
              <div class="tip-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span>Compartilhe o link do seu delivery</span>
              </div>
            </div>
          </div>
          <div v-else class="orders-grid">
            <div v-for="order in recentOrders" :key="order.id" class="order-card">
              <div class="order-card-header">
                <div class="order-id">#{{ order.id }}</div>
                <span class="status-badge" :class="order.status">
                  {{ getStatusText(order.status) }}
                </span>
              </div>
              <div class="order-card-body">
                <div class="order-info-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span class="order-label">Cliente:</span>
                  <span class="order-value">{{ order.customer }}</span>
                </div>
                <div class="order-info-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span class="order-label">Total:</span>
                  <span class="order-value order-total">{{ formatCurrency(order.total) }}</span>
                </div>
                <div class="order-info-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                  <span class="order-label">Data:</span>
                  <span class="order-value">{{ formatDate(order.createdAt) }}</span>
                </div>
              </div>
              <div class="order-card-footer">
                <button 
                  @click="viewOrder(order)" 
                  class="btn-view"
                  :title="`Ver detalhes do pedido #${order.id}`"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumo de Vendas -->
      <div class="content-card">
        <div class="card-header">
          <h2>Resumo de Vendas</h2>
        <div class="period-selector">
          <button 
            v-for="period in ['today', 'week', 'month', 'year']" 
            :key="period"
            @click="selectedPeriod = period"
            :class="['period-btn', { active: selectedPeriod === period }]"
            :title="`Ver dados de ${getPeriodLabel(period).toLowerCase()}`"
          >
            {{ getPeriodLabel(period) }}
          </button>
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
          <div v-if="stats.insights.topSellingItems.length === 0" class="empty-items">
            <div class="empty-icon-small">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 3h18l-2 14H5L3 3z"></path>
                <path d="M8 21h8"></path>
              </svg>
            </div>
            <p>Nenhum produto vendido ainda</p>
            <small>Os produtos mais vendidos aparecerão aqui</small>
          </div>
          <div v-else class="items-list">
            <div v-for="(item, index) in stats.insights.topSellingItems" :key="item.name" class="item-row">
              <div class="item-rank">{{ index + 1 }}º</div>
              <div class="item-name">{{ item.name }}</div>
              <div class="item-quantity">{{ item.quantity }} vendas</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vendas por Forma de Pagamento -->
      <div class="content-card">
        <div class="card-header">
          <h2>Vendas por Forma de Pagamento</h2>
          <div class="period-selector">
            <button 
              v-for="period in ['today', 'week', 'month', 'year']" 
              :key="period"
              @click="selectedPaymentPeriod = period"
              :class="['period-btn', { active: selectedPaymentPeriod === period }]"
              :title="`Ver dados de ${getPeriodLabel(period).toLowerCase()}`"
            >
              {{ getPeriodLabel(period) }}
            </button>
          </div>
        </div>
        <div class="payment-methods-grid">
          <div class="payment-method-card pix">
            <div class="payment-method-header">
              <div class="payment-method-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <h3>PIX</h3>
            </div>
            <div class="payment-method-stats">
              <div class="payment-stat-item">
                <span class="payment-stat-label">Receita:</span>
                <span class="payment-stat-value">{{ formatCurrency(currentPaymentData.pix.revenue) }}</span>
              </div>
              <div class="payment-stat-item">
                <span class="payment-stat-label">Pedidos:</span>
                <span class="payment-stat-value">{{ currentPaymentData.pix.orders }}</span>
              </div>
              <div class="payment-stat-item">
                <span class="payment-stat-label">Ticket Médio:</span>
                <span class="payment-stat-value">{{ formatCurrency(currentPaymentData.pix.orders > 0 ? currentPaymentData.pix.revenue / currentPaymentData.pix.orders : 0) }}</span>
              </div>
            </div>
          </div>

          <div class="payment-method-card dinheiro">
            <div class="payment-method-header">
              <div class="payment-method-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3>Dinheiro</h3>
            </div>
            <div class="payment-method-stats">
              <div class="payment-stat-item">
                <span class="payment-stat-label">Receita:</span>
                <span class="payment-stat-value">{{ formatCurrency(currentPaymentData.dinheiro.revenue) }}</span>
              </div>
              <div class="payment-stat-item">
                <span class="payment-stat-label">Pedidos:</span>
                <span class="payment-stat-value">{{ currentPaymentData.dinheiro.orders }}</span>
              </div>
              <div class="payment-stat-item">
                <span class="payment-stat-label">Ticket Médio:</span>
                <span class="payment-stat-value">{{ formatCurrency(currentPaymentData.dinheiro.orders > 0 ? currentPaymentData.dinheiro.revenue / currentPaymentData.dinheiro.orders : 0) }}</span>
              </div>
            </div>
          </div>

          <div class="payment-method-card cartao">
            <div class="payment-method-header">
              <div class="payment-method-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <h3>Cartão</h3>
            </div>
            <div class="payment-method-stats">
              <div class="payment-stat-item">
                <span class="payment-stat-label">Receita:</span>
                <span class="payment-stat-value">{{ formatCurrency(currentPaymentData.cartao.revenue) }}</span>
              </div>
              <div class="payment-stat-item">
                <span class="payment-stat-label">Pedidos:</span>
                <span class="payment-stat-value">{{ currentPaymentData.cartao.orders }}</span>
              </div>
              <div class="payment-stat-item">
                <span class="payment-stat-label">Ticket Médio:</span>
                <span class="payment-stat-value">{{ formatCurrency(currentPaymentData.cartao.orders > 0 ? currentPaymentData.cartao.revenue / currentPaymentData.cartao.orders : 0) }}</span>
              </div>
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

  <!-- Componente de Notificações -->
  <OrderNotifications
    :notifications="notifications"
    @view-order="(order) => viewOrder(mapOrderFromNotification(order))"
    @mark-read="markAsRead"
    @clear-all="clearNotifications"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import DashboardChart from '~/components/DashboardChart.vue'
import OrderNotifications from '~/components/OrderNotifications.vue'

// Definir layout
definePageMeta({
  layout: 'dashboard'
})

// Estado da página
const loading = ref(true)
const loadingOrders = ref(false)
const selectedPeriod = ref('today')
const selectedPaymentPeriod = ref('today')
const selectedChartPeriod = ref('today')
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
  },
  paymentMethods: {
    pix: { revenue: 0, orders: 0 },
    dinheiro: { revenue: 0, orders: 0 },
    cartao: { revenue: 0, orders: 0 }
  },
  paymentMethodsByPeriod: {
    today: { pix: { revenue: 0, orders: 0 }, dinheiro: { revenue: 0, orders: 0 }, cartao: { revenue: 0, orders: 0 } },
    week: { pix: { revenue: 0, orders: 0 }, dinheiro: { revenue: 0, orders: 0 }, cartao: { revenue: 0, orders: 0 } },
    month: { pix: { revenue: 0, orders: 0 }, dinheiro: { revenue: 0, orders: 0 }, cartao: { revenue: 0, orders: 0 } },
    year: { pix: { revenue: 0, orders: 0 }, dinheiro: { revenue: 0, orders: 0 }, cartao: { revenue: 0, orders: 0 } }
  }
})

// Dados do período atual selecionado
const currentPeriodData = computed(() => {
  return stats.value.periods[selectedPeriod.value] || stats.value.periods.today
})

// Dados de pagamento do período atual selecionado
const currentPaymentData = computed(() => {
  return stats.value.paymentMethodsByPeriod[selectedPaymentPeriod.value] || stats.value.paymentMethodsByPeriod.today
})

// Dados para gráficos
const salesChartData = computed(() => {
  const periods = ['today', 'week', 'month']
  return {
    labels: periods.map(p => getPeriodLabel(p)),
    datasets: [{
      label: 'Vendas (R$)',
      data: periods.map(p => stats.value.periods[p]?.revenue || 0),
      backgroundColor: 'rgba(255, 142, 36, 0.8)',
      borderColor: 'rgba(255, 142, 36, 1)',
      borderWidth: 1
    }]
  }
})

const ticketChartData = computed(() => {
  const periods = ['today', 'week', 'month']
  return {
    labels: periods.map(p => getPeriodLabel(p)),
    datasets: [{
      label: 'Ticket Médio (R$)',
      data: periods.map(p => stats.value.periods[p]?.averageTicket || 0),
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }
})

const productsChartData = computed(() => {
  const topProducts = (stats.value.insights.topSellingItems || [])
    .filter(p => p && p.name) // Filtrar itens válidos
    .slice(0, 5)
  
  return {
    labels: topProducts.map(p => p.name || 'Sem nome'),
    datasets: [{
      data: topProducts.map(p => p.quantity || 0),
      backgroundColor: [
        'rgba(255, 142, 36, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
})

const salesChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return 'R$ ' + value.toLocaleString('pt-BR')
        }
      }
    }
  }
}))

const ticketChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return 'R$ ' + value.toLocaleString('pt-BR')
        }
      }
    }
  }
}))

const productsChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  }
}))

// Pedidos recentes
const recentOrders = ref([])

// Funções
const getPeriodLabel = (period) => {
  const labels = {
    today: 'Hoje',
    week: 'Esta Semana',
    month: 'Este Mês',
    year: 'Este Ano'
  }
  return labels[period] || period
}

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
      },
      paymentMethods: {
        pix: { revenue: 0, orders: 0 },
        dinheiro: { revenue: 0, orders: 0 },
        cartao: { revenue: 0, orders: 0 }
      },
      paymentMethodsByPeriod: {
        today: { pix: { revenue: 0, orders: 0 }, dinheiro: { revenue: 0, orders: 0 }, cartao: { revenue: 0, orders: 0 } },
        week: { pix: { revenue: 0, orders: 0 }, dinheiro: { revenue: 0, orders: 0 }, cartao: { revenue: 0, orders: 0 } },
        month: { pix: { revenue: 0, orders: 0 }, dinheiro: { revenue: 0, orders: 0 }, cartao: { revenue: 0, orders: 0 } },
        year: { pix: { revenue: 0, orders: 0 }, dinheiro: { revenue: 0, orders: 0 }, cartao: { revenue: 0, orders: 0 } }
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

// Sistema de notificações em tempo real
const {
  notifications,
  startNotifications,
  stopNotifications,
  markAsRead,
  clearAll: clearNotifications
} = useOrderNotifications()

// Função para mapear pedido da notificação
const mapOrderFromNotification = (order) => {
  return {
    id: order.orderNumber,
    customer: order.customerInfo?.name,
    status: order.status,
    total: order.totalAmount,
    createdAt: order.createdAt,
    items: order.items?.map(item => ({
      id: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })) || []
  }
}

// Watcher para atualizar quando novos pedidos chegarem
watch(notifications, async (newNotifs) => {
  const unreadCount = newNotifs.filter(n => !n.read).length
  if (unreadCount > 0) {
    // Recarregar stats e pedidos automaticamente
    await Promise.all([
      loadStats(),
      loadOrders()
    ])
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  // Aguardar um pouco para garantir que a autenticação seja verificada
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    await Promise.all([
      loadStats(),
      loadOrders()
    ])
    
    // Iniciar notificações em tempo real automaticamente (com delay para evitar múltiplas inicializações)
    setTimeout(() => {
      console.log('[Dashboard] Iniciando notificações...')
      startNotifications()
    }, 500)
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error)
  }
})

onUnmounted(() => {
  // Parar notificações quando componente for desmontado
  stopNotifications()
})
</script>

<style scoped>
.dashboard-home {
  padding: 0;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: #ff8e24;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.3);
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 142, 36, 0.4);
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

/* Botões de Período */
.period-selector {
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.25rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.period-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.period-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.period-btn.active {
  background: #ff8e24;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 142, 36, 0.3);
}

.period-btn.active:hover {
  background: #e67e22;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.4);
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

/* Gráficos */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 0;
}

/* Pedidos Recentes ocupam toda largura */
.orders-full-width {
  grid-column: 1 / -1;
  width: 100%;
}

.chart-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

.chart-header {
  padding: 1.75rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-card .chart-container {
  padding: 1rem;
  height: 300px;
}

/* Gráfico de produtos mais vendidos ocupa duas colunas */
.chart-card:nth-child(3) {
  grid-column: 1 / -1;
}

.chart-card:nth-child(3) .chart-container {
  height: 250px;
}

.content-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
}

.card-header h2 {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.orders-grid-container {
  padding: 1rem;
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

/* Grid de Pedidos - Ocupa toda largura disponível */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

.order-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: visible;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-color: #ff8e24;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.order-id {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  word-break: break-word;
}

.order-card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.order-info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  font-size: 0.875rem;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.order-info-item svg {
  color: #64748b;
  flex-shrink: 0;
  margin-top: 0.125rem;
  width: 16px;
  height: 16px;
}

.order-label {
  color: #64748b;
  font-weight: 500;
  flex-shrink: 0;
  min-width: fit-content;
}

.order-value {
  color: #1e293b;
  font-weight: 600;
  margin-left: auto;
  text-align: right;
  word-break: break-word;
  flex: 1;
  min-width: 0;
}

.order-total {
  color: #ff8e24;
  font-size: 1rem;
  font-weight: 700;
}

.order-card-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.order-card-footer .btn-view {
  width: 100%;
  justify-content: center;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
}

/* Enhanced Empty States */
.empty-icon {
  margin-bottom: 1.5rem;
}

.empty-icon svg {
  color: #d1d5db;
  animation: float 3s ease-in-out infinite;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-state p {
  margin: 0 0 2rem 0;
  font-size: 1.125rem;
  line-height: 1.6;
}

.empty-tips {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 300px;
  margin: 0 auto;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.tip-item svg {
  color: #ff8e24;
  flex-shrink: 0;
}

.tip-item span {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.empty-items {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
}

.empty-icon-small {
  margin-bottom: 1rem;
}

.empty-icon-small svg {
  color: #d1d5db;
}

.empty-items p {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
}

.empty-items small {
  font-size: 0.875rem;
  color: #9ca3af;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
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

.btn-view {
  padding: 0.5rem 1rem;
  background: #ff8e24;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(255, 142, 36, 0.3);
}

.btn-view:hover {
  background: #e67e22;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.4);
}

.btn-view:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(255, 142, 36, 0.3);
}

.sales-summary {
  padding: 1.75rem;
  background: #f8fafc;
}

.sales-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(241, 245, 249, 0.8);
  transition: all 0.2s ease;
}

.sales-item:hover {
  background: rgba(255, 142, 36, 0.05);
  margin: 0 -1rem;
  padding-left: 1rem;
  padding-right: 1rem;
  border-radius: 0.5rem;
}

.sales-item:last-child {
  border-bottom: none;
}

.sales-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.sales-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

/* Vendas por Forma de Pagamento */
.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.payment-method-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.payment-method-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.payment-method-card.pix {
  border-color: #32BCAD;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%);
}

.payment-method-card.pix:hover {
  border-color: #2A9D8F;
  box-shadow: 0 12px 24px rgba(50, 188, 173, 0.2);
}

.payment-method-card.dinheiro {
  border-color: #10B981;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.payment-method-card.dinheiro:hover {
  border-color: #059669;
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.2);
}

.payment-method-card.cartao {
  border-color: #3B82F6;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.payment-method-card.cartao:hover {
  border-color: #2563EB;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.2);
}

.payment-method-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.payment-method-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.payment-method-card.pix .payment-method-icon {
  background: linear-gradient(135deg, #32BCAD 0%, #2A9D8F 100%);
  color: white;
}

.payment-method-card.dinheiro .payment-method-icon {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
}

.payment-method-card.cartao .payment-method-icon {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
}

.payment-method-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.payment-method-stats {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.payment-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.payment-stat-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.payment-stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.payment-stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

/* Top Items Styles */
.top-items {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.top-items h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 0.875rem;
  background: #ffffff;
  border-radius: 0.5rem;
  gap: 0.875rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.item-row:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-rank {
  width: 2rem;
  height: 2rem;
  background: #ff8e24;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 142, 36, 0.3);
  flex-shrink: 0;
}

.item-name {
  flex: 1;
  color: #1e293b;
  font-weight: 600;
  font-size: 0.875rem;
}

.item-quantity {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(100, 116, 139, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
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
  padding: 1rem;
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
  padding: 1rem;
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

/* Micro-interactions e UX melhorias */
.stat-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-2px) scale(1.02);
}

.stat-card:active {
  transform: translateY(0) scale(0.98);
}

.btn-refresh, .btn-view, .period-btn {
  position: relative;
  overflow: hidden;
}

.btn-refresh::before, .btn-view::before, .period-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-refresh:hover::before, .btn-view:hover::before, .period-btn:hover::before {
  left: 100%;
}

/* Melhorias de acessibilidade */
.stat-icon:focus,
.btn-refresh:focus,
.btn-view:focus,
.period-btn:focus {
  outline: 2px solid #ff8e24;
  outline-offset: 2px;
}

/* Estados de loading mais suaves */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* Melhorias de contraste */
.sales-value, .stat-content h3 {
  font-weight: 700;
  color: #1f2937;
}

.sales-label, .stat-content p {
  font-weight: 500;
  color: #6b7280;
}

/* Animações de entrada */
.stat-card, .content-card {
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animation para cards */
.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

.content-card:nth-child(1) { animation-delay: 0.5s; }
.content-card:nth-child(2) { animation-delay: 0.6s; }

.order-card {
  animation: slideInUp 0.6s ease-out;
}

.order-card:nth-child(1) { animation-delay: 0.1s; }
.order-card:nth-child(2) { animation-delay: 0.2s; }
.order-card:nth-child(3) { animation-delay: 0.3s; }
.order-card:nth-child(4) { animation-delay: 0.4s; }
.order-card:nth-child(5) { animation-delay: 0.5s; }

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
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-card:nth-child(3) {
    grid-column: 1;
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
  
  .page-description {
    font-size: 0.875rem;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .orders-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .order-card {
    min-height: auto;
  }
  
  .order-card-body {
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .order-info-item {
    flex-wrap: wrap;
  }
  
  .order-value {
    margin-left: 0;
    text-align: left;
    width: 100%;
    margin-top: 0.25rem;
  }
  
  .orders-grid-container {
    padding: 1rem;
  }
  
  .payment-methods-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
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