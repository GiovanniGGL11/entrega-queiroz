<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

const { authenticatedFetch } = useAuthenticatedFetch()

const customers = ref([])
const loading = ref(true)
const search = ref('')
const selectedCustomer = ref(null)
const showModal = ref(false)

const formatPrice = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

const formatDateTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const statusMap = {
  pending: { label: 'Pendente', cls: 'status-pending' },
  confirmed: { label: 'Confirmado', cls: 'status-confirmed' },
  preparing: { label: 'Preparando', cls: 'status-preparing' },
  ready: { label: 'Pronto', cls: 'status-ready' },
  out_for_delivery: { label: 'Em entrega', cls: 'status-delivery' },
  delivered: { label: 'Entregue', cls: 'status-delivered' },
  cancelled: { label: 'Cancelado', cls: 'status-cancelled' }
}

const filteredCustomers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return customers.value
  return customers.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  )
})

const openCustomer = (customer) => {
  selectedCustomer.value = customer
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedCustomer.value = null
}

const loadCustomers = async () => {
  loading.value = true
  try {
    const data = await authenticatedFetch('/api/dashboard/customers')
    customers.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadCustomers)
</script>

<template>
  <div class="customers-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Clientes</h1>
        <p class="page-description">Histórico e informações de todos os clientes</p>
      </div>
      <div class="header-stats" v-if="!loading">
        <div class="stat-pill">
          <span class="stat-num">{{ customers.length }}</span>
          <span class="stat-lbl">clientes</span>
        </div>
        <div class="stat-pill">
          <span class="stat-num">{{ customers.reduce((s, c) => s + c.totalOrders, 0) }}</span>
          <span class="stat-lbl">pedidos</span>
        </div>
      </div>
    </div>

    <!-- Busca -->
    <div class="search-bar">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input v-model="search" type="text" placeholder="Buscar por nome, telefone ou e-mail..." class="search-input" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando clientes...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredCustomers.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <p>{{ search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda.' }}</p>
    </div>

    <!-- Tabela -->
    <div v-else class="table-wrapper">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Telefone</th>
            <th class="col-center">Pedidos</th>
            <th class="col-right">Total gasto</th>
            <th>Último pedido</th>
            <th class="col-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in filteredCustomers" :key="customer.phone" class="customer-row">
            <td>
              <div class="customer-name-cell">
                <div class="avatar">
                  <img v-if="customer.avatar" :src="customer.avatar" :alt="customer.name" class="avatar-img" />
                  <span v-else>{{ customer.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div>
                  <div class="customer-name">{{ customer.name }}</div>
                  <div v-if="customer.email" class="customer-email">{{ customer.email }}</div>
                </div>
              </div>
            </td>
            <td class="phone-cell">{{ customer.phone }}</td>
            <td class="col-center">
              <span class="orders-badge">{{ customer.totalOrders }}</span>
            </td>
            <td class="col-right total-cell">{{ formatPrice(customer.totalSpent) }}</td>
            <td class="date-cell">{{ formatDate(customer.lastOrder) }}</td>
            <td class="col-center">
              <button @click="openCustomer(customer)" class="btn-detail">
                Ver histórico
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal histórico -->
    <div v-if="showModal && selectedCustomer" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title-row">
            <div class="modal-avatar">
              <img v-if="selectedCustomer.avatar" :src="selectedCustomer.avatar" :alt="selectedCustomer.name" class="avatar-img" />
              <span v-else>{{ selectedCustomer.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div>
              <h2>{{ selectedCustomer.name }}</h2>
              <p class="modal-subtitle">{{ selectedCustomer.phone }}<span v-if="selectedCustomer.email"> · {{ selectedCustomer.email }}</span></p>
            </div>
          </div>
          <button @click="closeModal" class="btn-close">✕</button>
        </div>

        <!-- Stats do cliente -->
        <div class="client-stats">
          <div class="client-stat">
            <span class="cs-num">{{ selectedCustomer.totalOrders }}</span>
            <span class="cs-lbl">Pedidos</span>
          </div>
          <div class="client-stat">
            <span class="cs-num">{{ formatPrice(selectedCustomer.totalSpent) }}</span>
            <span class="cs-lbl">Total gasto</span>
          </div>
          <div class="client-stat">
            <span class="cs-num">{{ formatPrice(selectedCustomer.totalOrders > 0 ? selectedCustomer.totalSpent / selectedCustomer.totalOrders : 0) }}</span>
            <span class="cs-lbl">Ticket médio</span>
          </div>
          <div class="client-stat">
            <span class="cs-num">{{ formatDate(selectedCustomer.firstOrder) }}</span>
            <span class="cs-lbl">Primeiro pedido</span>
          </div>
        </div>

        <!-- Endereços -->
        <div v-if="selectedCustomer.addresses && selectedCustomer.addresses.length > 0" class="modal-section">
          <h3>Endereços</h3>
          <div class="addresses-list">
            <div v-for="(addr, i) in selectedCustomer.addresses" :key="i" class="address-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{{ [addr.address, addr.neighborhood, addr.city].filter(Boolean).join(', ') }}</span>
            </div>
          </div>
        </div>

        <!-- Histórico de pedidos -->
        <div class="modal-section">
          <h3>Histórico de Pedidos</h3>
          <div class="orders-history">
            <div v-for="order in selectedCustomer.orders" :key="order.id" class="history-item">
              <div class="history-top">
                <span class="history-num">{{ order.orderNumber }}</span>
                <span :class="['history-status', statusMap[order.status]?.cls || '']">
                  {{ statusMap[order.status]?.label || order.status }}
                </span>
                <span class="history-total">{{ formatPrice(order.totalAmount) }}</span>
              </div>
              <div class="history-date">{{ formatDateTime(order.createdAt) }}</div>
              <div v-if="order.items && order.items.length" class="history-items">
                <span v-for="item in order.items" :key="item.name" class="history-product">
                  {{ item.quantity }}x {{ item.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.customers-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  margin: 0;
}

.page-description {
  color: var(--color-text-secondary, #64748b);
  font-size: 0.9375rem;
  margin: 0.25rem 0 0;
}

.header-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 0.625rem 1.25rem;
  min-width: 80px;
}

.stat-num {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--color-primary, #ff8e24);
}

.stat-lbl {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #64748b);
  font-weight: 500;
}

/* Busca */
.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 0.625rem 1rem;
  margin-bottom: 1.5rem;
  color: var(--color-text-secondary, #64748b);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.9375rem;
  background: transparent;
  color: var(--color-text, #1e293b);
}

.search-input::placeholder { color: var(--color-text-secondary, #94a3b8); }

/* Loading / Empty */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-secondary, #64748b);
}

.spinner {
  width: 40px; height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #ff8e24);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Tabela */
.table-wrapper {
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 1rem;
  overflow: hidden;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
}

.customers-table thead th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-bg, #f8fafc);
  border-bottom: 1.5px solid var(--color-border, #e2e8f0);
}

.col-center { text-align: center !important; }
.col-right { text-align: right !important; }

.customer-row {
  border-bottom: 1px solid var(--color-border, #f1f5f9);
  transition: background 0.15s;
}
.customer-row:last-child { border-bottom: none; }
.customer-row:hover { background: var(--color-bg, #f8fafc); }

.customers-table td {
  padding: 0.875rem 1rem;
  font-size: 0.9rem;
  color: var(--color-text, #1e293b);
  vertical-align: middle;
}

.customer-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary, #ff8e24), #f59e0b);
  color: #fff;
  font-weight: 700;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.customer-name { font-weight: 600; }
.customer-email { font-size: 0.8125rem; color: var(--color-text-secondary, #64748b); }
.phone-cell { font-family: monospace; font-size: 0.875rem; }
.date-cell { font-size: 0.875rem; color: var(--color-text-secondary, #64748b); }
.total-cell { font-weight: 700; color: var(--color-primary, #ff8e24); }

.orders-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.5rem;
  background: var(--color-primary, #ff8e24);
  color: #fff;
  border-radius: 99px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.btn-detail {
  padding: 0.375rem 0.875rem;
  background: var(--color-bg, #f1f5f9);
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--color-text, #1e293b);
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-detail:hover {
  background: var(--color-primary, #ff8e24);
  color: #fff;
  border-color: var(--color-primary, #ff8e24);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--color-surface, #fff);
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  position: sticky;
  top: 0;
  background: var(--color-surface, #fff);
  z-index: 1;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.modal-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary, #ff8e24), #f59e0b);
  color: #fff;
  font-weight: 800;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-header h2 { font-size: 1.125rem; font-weight: 700; margin: 0; }
.modal-subtitle { font-size: 0.875rem; color: var(--color-text-secondary, #64748b); margin: 0.2rem 0 0; }

.btn-close {
  background: none; border: none; font-size: 1.25rem;
  cursor: pointer; color: var(--color-text-secondary, #64748b);
  padding: 0.25rem; line-height: 1; flex-shrink: 0;
}

/* Stats do cliente */
.client-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.client-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-right: 1px solid var(--color-border, #e2e8f0);
  text-align: center;
}
.client-stat:last-child { border-right: none; }

.cs-num {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary, #ff8e24);
}
.cs-lbl {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #64748b);
  margin-top: 0.2rem;
}

/* Seções do modal */
.modal-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}
.modal-section:last-child { border-bottom: none; }
.modal-section h3 {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #64748b);
  margin: 0 0 0.875rem;
}

/* Endereços */
.addresses-list { display: flex; flex-direction: column; gap: 0.5rem; }
.address-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text, #1e293b);
}
.address-item svg { flex-shrink: 0; margin-top: 2px; color: var(--color-primary, #ff8e24); }

/* Histórico */
.orders-history { display: flex; flex-direction: column; gap: 0.75rem; }

.history-item {
  background: var(--color-bg, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
}

.history-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.history-num {
  font-family: monospace;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-text, #1e293b);
}

.history-status {
  padding: 0.2rem 0.625rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pending { background: #fef9c3; color: #854d0e; }
.status-confirmed { background: #dbeafe; color: #1e40af; }
.status-preparing { background: #fed7aa; color: #9a3412; }
.status-ready { background: #d1fae5; color: #065f46; }
.status-delivery { background: #ede9fe; color: #5b21b6; }
.status-delivered { background: #dcfce7; color: #166534; }
.status-cancelled { background: #fee2e2; color: #991b1b; }

.history-total {
  margin-left: auto;
  font-weight: 700;
  color: var(--color-primary, #ff8e24);
  font-size: 0.9375rem;
}

.history-date {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #64748b);
  margin-top: 0.3rem;
}

.history-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.history-product {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 99px;
  padding: 0.2rem 0.625rem;
  font-size: 0.8rem;
  color: var(--color-text, #1e293b);
}

@media (max-width: 768px) {
  .client-stats { grid-template-columns: repeat(2, 1fr); }
  .customers-table thead { display: none; }
  .customers-table td { display: block; padding: 0.4rem 1rem; }
  .customers-table tr { display: block; border-bottom: 1.5px solid var(--color-border, #e2e8f0); padding: 0.75rem 0; }
  .col-center, .col-right { text-align: left !important; }
  .header-stats { display: none; }
}
</style>
