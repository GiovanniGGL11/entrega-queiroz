<template>
  <div class="orders-page">
    <div class="page-header">
      <div class="header-left">
        <h1>Gerenciar Pedidos</h1>
      </div>
      <div class="header-actions">
        <button @click="openCreateOrderModal" class="btn-create">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo Pedido
        </button>
        <button
          v-if="lateOrders.length > 0"
          @click="markAllLateAsDelivered"
          class="btn-mark-late"
          :disabled="markingLate"
          :title="`Marcar ${lateOrders.length} pedido(s) em atraso como entregue`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ markingLate ? 'Aguarde...' : `Entregar atrasados (${lateOrders.length})` }}
        </button>
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

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label for="statusFilter">Status</label>
          <select id="statusFilter" v-model="statusFilter" @change="loadOrders" class="filter-select">
            <option value="">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="confirmed">Confirmados</option>
            <option value="preparing">Preparando</option>
            <option value="ready">Prontos</option>
            <option value="out_for_delivery">Saiu para entrega</option>
            <option value="delivered">Entregues</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="periodFilter">Período</label>
          <select id="periodFilter" v-model="periodFilter" @change="onPeriodChange" class="filter-select">
            <option value="all">Todos os pedidos</option>
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
            <option value="custom">Período Personalizado</option>
          </select>
        </div>
        
        <div v-if="periodFilter === 'custom'" class="filter-group date-range-group">
          <label for="startDate">Data Inicial</label>
          <input 
            id="startDate"
            v-model="startDate" 
            type="date" 
            class="filter-date"
            @change="loadOrders"
          />
        </div>
        
        <div v-if="periodFilter === 'custom'" class="filter-group date-range-group">
          <label for="endDate">Data Final</label>
          <input 
            id="endDate"
            v-model="endDate" 
            type="date" 
            class="filter-date"
            @change="loadOrders"
          />
        </div>
        
        <div class="filter-group filter-actions">
          <button @click="clearFilters" class="btn-clear-filters" :disabled="!hasActiveFilters">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Limpar Filtros
          </button>
        </div>
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
        <div v-for="order in [...orders].sort((a, b) => (isOrderLate(b) ? 1 : 0) - (isOrderLate(a) ? 1 : 0))" :key="order.id" :class="['order-card', { 'order-card--late': isOrderLate(order) }]">
          <!-- Banner de atraso -->
          <div v-if="isOrderLate(order)" class="late-banner">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Em atraso há {{ minutesLate(order) }} min</span>
          </div>

          <!-- Header do Card -->
          <div class="order-header">
            <div class="order-number-section">
              <div class="order-number">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                <span class="order-id">#{{ order.id }}</span>
              </div>
              <span class="order-date">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {{ formatDate(order.createdAt) }}
              </span>
            </div>
            <div class="order-badges">
              <span class="type-badge" :class="order.type || 'delivery'">
                <svg v-if="order.type === 'balcao'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <svg v-else-if="order.type === 'retirada'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                {{ order.type === 'balcao' ? 'Balcão' : order.type === 'retirada' ? 'Retirada' : 'Delivery' }}
              </span>
              <span class="status-badge" :class="order.status">
                {{ getStatusText(order.status, order.type) }}
              </span>
            </div>
          </div>
          
          <!-- Informações do Cliente -->
          <div class="order-section customer-section">
            <div class="section-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Cliente
            </div>
            <div class="customer-info">
              <div class="customer-name">{{ order.customer }}</div>
              <div v-if="order.phone" class="customer-phone">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                {{ order.phone }}
              </div>
            </div>
          </div>
          
          <!-- Itens do Pedido -->
          <div class="order-section items-section">
            <div class="section-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Itens ({{ order.items.length }})
            </div>
            <div class="order-items">
              <div v-for="(item, index) in order.items.slice(0, 3)" :key="item.id || index" class="order-item">
                <span class="item-quantity">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">{{ formatCurrency(item.price) }}</span>
              </div>
              <div v-if="order.items.length > 3" class="more-items">
                +{{ order.items.length - 3 }} item{{ order.items.length - 3 > 1 ? 's' : '' }}
              </div>
            </div>
          </div>
          
          <!-- Informações de Pagamento e Entrega -->
          <div class="order-section payment-section">
            <div class="payment-info">
              <div class="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span class="info-label">Pagamento:</span>
                <span class="info-value">{{ getPaymentMethodText(order.paymentMethod) }}</span>
              </div>
              <div v-if="order.deliveryFee && order.deliveryFee > 0" class="info-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span class="info-label">Entrega:</span>
                <span class="info-value">{{ formatCurrency(order.deliveryFee) }}</span>
              </div>
              <div v-if="order.status === 'out_for_delivery' || order.motoboyNome" class="info-item motoboy-info-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path>
                </svg>
                <span class="info-label">Motoboy:</span>
                <span class="info-value" :class="order.motoboyNome ? 'motoboy-name' : 'motoboy-empty-name'">
                  {{ order.motoboyNome || 'Não atribuído' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Observações -->
          <div v-if="order.notes && order.notes.trim()" class="order-section notes-section">
            <div class="order-notes">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <div class="notes-content">
                <span class="notes-text">{{ order.notes }}</span>
              </div>
            </div>
          </div>
          
          <!-- Desconto cupom -->
          <div v-if="order.discount > 0" class="order-discount-row">
            <span class="discount-label-card">
              Desconto
              <span v-if="order.coupon" class="coupon-badge-card">{{ order.coupon.code }}</span>
            </span>
            <span class="discount-val-card">-{{ formatCurrency(order.discount) }}</span>
          </div>

          <!-- Total -->
          <div class="order-total-section">
            <div class="total-label">Total do Pedido</div>
            <div class="total-value">{{ formatCurrency(order.total) }}</div>
          </div>
          
          <!-- Ações -->
          <div class="order-actions">
            <button
              @click="showEditStatusModal(order)"
              class="btn-action btn-edit"
              title="Editar status"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Status
            </button>
            <button
              @click="printComanda(order)"
              class="btn-action btn-print"
              title="Imprimir comanda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Comanda
            </button>
            <button
              @click="viewOrderDetails(order)"
              class="btn-action btn-view"
              title="Ver detalhes completos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Detalhes
            </button>
            <button
              @click="confirmDeleteOrder(order)"
              class="btn-action btn-delete"
              title="Excluir pedido"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
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
              <div class="detail-row" v-if="selectedOrder.discount > 0" style="color:#16a34a; font-weight:600;">
                <span class="label">
                  Desconto
                  <span v-if="selectedOrder.coupon" style="margin-left:0.4rem;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:99px;font-size:0.7rem;font-weight:700;padding:0.1rem 0.5rem;letter-spacing:0.04em;">{{ selectedOrder.coupon.code }}</span>
                </span>
                <span class="value" style="color:#16a34a;">-{{ formatCurrency(selectedOrder.discount) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total:</span>
                <span class="value total">{{ formatCurrency(selectedOrder.total) }}</span>
              </div>
            </div>
            
            <div v-if="selectedOrder.notes && selectedOrder.notes.trim()" class="detail-section">
              <h4>Observações</h4>
              <p class="notes-content">{{ selectedOrder.notes }}</p>
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
            <span class="current-status">{{ getStatusText(orderToUpdate?.status, orderToUpdate?.type) }}</span>
          </div>
          <div class="form-group">
            <label for="newStatus">Novo Status:</label>
            <select id="newStatus" v-model="newStatus" class="status-select">
              <option
                v-for="opt in statusOptionsForOrder"
                :key="opt.value"
                :value="opt.value"
              >{{ opt.label }}</option>
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

    <!-- Modal de Seleção de Motoboy -->
    <div v-if="showMotoboyModal" class="status-overlay" @click.self="showMotoboyModal = false">
      <div class="modal-content status-modal" @click.stop>
        <div class="modal-header">
          <h3>Quem irá levar?</h3>
          <button @click="showMotoboyModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div v-if="motoboysAtivos.length === 0" class="motoboy-empty">
            <p>Nenhum motoboy marcou presença hoje.</p>
            <p>Vá em <strong>Motoboys</strong> e marque quem veio trabalhar.</p>
          </div>
          <div v-else class="motoboy-list">
            <div
              v-for="m in motoboysAtivos"
              :key="m._id"
              class="motoboy-option"
              :class="{ selected: selectedMotoboyId === m._id }"
              @click="selectedMotoboyId = m._id; selectedMotoboyNome = m.nome"
            >
              <div class="motoboy-opt-avatar">
                <img v-if="m.foto" :src="m.foto" :alt="m.nome" />
                <span v-else>{{ m.nome.charAt(0).toUpperCase() }}</span>
              </div>
              <span class="motoboy-opt-nome">{{ m.nome }}</span>
              <svg v-if="selectedMotoboyId === m._id" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--color-primary); margin-left: auto;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showMotoboyModal = false" class="btn-cancel-modal">Cancelar</button>
          <button @click="confirmarComMotoboy" class="btn-confirm-modal" :disabled="!selectedMotoboyId && motoboysAtivos.length > 0">
            Confirmar Entrega
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Criar Pedido -->
    <div v-if="showCreateOrderModal" class="modal-overlay" @click="closeCreateOrderModal">
      <div class="modal-content create-order-modal" @click.stop>
        <div class="modal-header">
          <h3>Criar Novo Pedido</h3>
          <button @click="closeCreateOrderModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createOrder" class="create-order-form">
            <div class="form-group">
              <label for="customerName">Nome do Cliente *</label>
              <input
                id="customerName"
                v-model="newOrder.customerInfo.name"
                type="text"
                required
                placeholder="Nome completo"
              />
            </div>
            
            <div class="form-group">
              <label for="customerPhone">Telefone *</label>
              <input
                id="customerPhone"
                v-model="newOrder.customerInfo.phone"
                type="tel"
                required
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div class="form-group">
              <label for="customerEmail">Email</label>
              <input
                id="customerEmail"
                v-model="newOrder.customerInfo.email"
                type="email"
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div class="form-group">
              <label for="deliveryAddress">Endereço de Entrega *</label>
              <input
                id="deliveryAddress"
                v-model="newOrder.deliveryInfo.address"
                type="text"
                required
                placeholder="Rua, Avenida, etc."
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="deliveryNumber">Número</label>
                <input
                  id="deliveryNumber"
                  v-model="newOrder.deliveryInfo.number"
                  type="text"
                  placeholder="123"
                />
              </div>
              
              <div class="form-group">
                <label for="deliveryZipCode">CEP</label>
                <input
                  id="deliveryZipCode"
                  v-model="newOrder.deliveryInfo.zipCode"
                  type="text"
                  placeholder="12345-678"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="deliveryNeighborhood">Bairro</label>
              <input
                id="deliveryNeighborhood"
                v-model="newOrder.deliveryInfo.neighborhood"
                type="text"
                placeholder="Bairro"
              />
            </div>
            
            <div class="form-group">
              <label for="deliveryCity">Cidade</label>
              <input
                id="deliveryCity"
                v-model="newOrder.deliveryInfo.city"
                type="text"
                placeholder="Cidade"
              />
            </div>
            
            <div class="form-group">
              <label for="paymentMethod">Método de Pagamento *</label>
              <select id="paymentMethod" v-model="newOrder.paymentMethod" required>
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="orderNotes">Observações</label>
              <textarea
                id="orderNotes"
                v-model="newOrder.notes"
                rows="3"
                placeholder="Observações do pedido..."
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>Itens do Pedido *</label>
              <div class="order-items-section">
                <div v-for="(item, index) in newOrder.items" :key="index" class="order-item-row">
                  <input
                    v-model="item.name"
                    type="text"
                    placeholder="Nome do item"
                    required
                    class="item-name-input"
                  />
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="1"
                    placeholder="Qtd"
                    required
                    class="item-qty-input"
                  />
                  <input
                    v-model.number="item.price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Preço"
                    required
                    class="item-price-input"
                  />
                  <button
                    type="button"
                    @click="removeOrderItem(index)"
                    class="btn-remove-item"
                    v-if="newOrder.items.length > 1"
                  >
                    ×
                  </button>
                </div>
                <button type="button" @click="addOrderItem" class="btn-add-item">
                  + Adicionar Item
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label for="deliveryFee">Taxa de Entrega</label>
              <input
                id="deliveryFee"
                v-model.number="newOrder.deliveryInfo.deliveryFee"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            
            <div class="modal-footer">
              <button type="button" @click="closeCreateOrderModal" class="btn-cancel-modal">
                Cancelar
              </button>
              <button type="submit" class="btn-confirm-modal" :disabled="creatingOrder">
                {{ creatingOrder ? 'Criando...' : 'Criar Pedido' }}
              </button>
            </div>
          </form>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Alert from '~/components/Alert.vue'
import OrderNotifications from '~/components/OrderNotifications.vue'
import { useAlert } from '~/composables/useAlert'

// Definir layout
definePageMeta({
  layout: 'dashboard'
})

// Composable de alert
const { alert, showSuccess, showError, showWarning, showInfo } = useAlert()

// Nome da loja (para comanda)
const storeName = ref('Queiroz Hamburgueria')

// Estado da página
const loading = ref(false)
const orders = ref([])
const statusFilter = ref('')
const periodFilter = ref('all')
const startDate = ref('')
const endDate = ref('')
const selectedOrder = ref(null)
const showStatusModal = ref(false)
const orderToUpdate = ref(null)
const newStatus = ref('')
const showMotoboyModal = ref(false)
const motoboysAtivos = ref([])
const selectedMotoboyId = ref('')
const selectedMotoboyNome = ref('')
const showCreateOrderModal = ref(false)
const creatingOrder = ref(false)
const newOrder = ref({
  customerInfo: {
    name: '',
    phone: '',
    email: ''
  },
  deliveryInfo: {
    address: '',
    number: '',
    zipCode: '',
    neighborhood: '',
    city: '',
    deliveryFee: 0
  },
  paymentMethod: 'dinheiro',
  notes: '',
  items: [
    { name: '', quantity: 1, price: 0 }
  ]
})
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
    type: order.type || 'delivery',
    attendant: order.attendant || '',
    total: order.totalAmount,
    subtotal: (order.items || []).reduce((s, i) => s + (i.subtotal ?? i.price * i.quantity ?? 0), 0),
    discount: order.discount ?? 0,
    coupon: order.coupon ?? null,
    deliveryFee: order.deliveryInfo?.deliveryFee,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    createdAt: order.createdAt,
    estimatedTime: order.deliveryInfo?.estimatedTime || '',
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

const getStatusText = (status, orderType = 'delivery') => {
  const isBalcao = orderType === 'balcao'
  const isRetirada = orderType === 'retirada'

  const statusMap = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Em Preparo',
    ready: isBalcao ? 'Pronto, retire no balcão' : isRetirada ? 'Pronto, retire no local' : 'Pronto',
    out_for_delivery: 'Saiu para entrega',
    delivered: isBalcao || isRetirada ? 'Finalizado' : 'Entregue',
    cancelled: 'Cancelado'
  }
  return statusMap[status] || status
}

const statusOptionsForOrder = computed(() => {
  const type = orderToUpdate.value?.type || 'delivery'
  if (type === 'balcao') {
    return [
      { value: 'confirmed', label: 'Confirmado' },
      { value: 'preparing', label: 'Em Preparo' },
      { value: 'ready', label: 'Pronto, retire no balcão' },
      { value: 'delivered', label: 'Finalizado' },
      { value: 'cancelled', label: 'Cancelado' },
    ]
  }
  if (type === 'retirada') {
    return [
      { value: 'pending', label: 'Pendente' },
      { value: 'confirmed', label: 'Confirmado' },
      { value: 'preparing', label: 'Em Preparo' },
      { value: 'ready', label: 'Pronto, retire no local' },
      { value: 'delivered', label: 'Finalizado' },
      { value: 'cancelled', label: 'Cancelado' },
    ]
  }
  // delivery
  return [
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'preparing', label: 'Em Preparo' },
    { value: 'ready', label: 'Pronto' },
    { value: 'out_for_delivery', label: 'Saiu para entrega' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
  ]
})

const getPaymentMethodText = (method) => {
  const methodMap = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão'
  }
  return methodMap[method] || method || 'Não informado'
}

const { authenticatedFetch, clearCache } = useAuthenticatedFetch()

// Computed para verificar se há filtros ativos
const hasActiveFilters = computed(() => {
  return statusFilter.value !== '' || periodFilter.value !== 'all'
})

// Verifica se pedido está em atraso (apenas status ativos, não entregues/cancelados)
const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']

const isOrderLate = (order) => {
  if (!activeStatuses.includes(order.status)) return false
  const created = new Date(order.createdAt).getTime()
  const now = Date.now()
  const elapsedMin = (now - created) / 60000

  // Tentar extrair tempo máximo do estimatedTime (ex: "30-45 min" → 45)
  let maxMin = 60 // padrão: 60 min
  if (order.estimatedTime) {
    const match = order.estimatedTime.match(/(\d+)-(\d+)/)
    if (match) maxMin = parseInt(match[2])
    else {
      const single = order.estimatedTime.match(/(\d+)/)
      if (single) maxMin = parseInt(single[1])
    }
  }
  return elapsedMin > maxMin
}

const printComanda = (order) => {
  const name = storeName.value || 'Queiroz Hamburgueria'

  const itemsHtml = order.items.map(item => {
    const complementsHtml = item.complements && item.complements.length
      ? item.complements.map(c => `<div class="complement">+ ${c.quantity}x ${c.name}</div>`).join('')
      : ''
    return `
      <div class="item-row">
        <span class="item-qty">${item.quantity}x</span>
        <div class="item-info">
          <span class="item-name">${item.name}</span>
          ${complementsHtml}
        </div>
      </div>`
  }).join('')

  const address = order.address
    ? `${order.address}${order.number ? ', ' + order.number : ''}${order.neighborhood ? ' - ' + order.neighborhood : ''}`
    : '—'

  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Comanda #${order.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 13px; width: 80mm; padding: 8px; color: #000; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .big { font-size: 18px; font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .divider-solid { border-top: 2px solid #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .label { color: #555; font-size: 11px; text-transform: uppercase; margin-top: 6px; margin-bottom: 2px; }
    .item-row { display: flex; gap: 6px; margin: 4px 0; }
    .item-qty { font-weight: bold; min-width: 24px; }
    .item-name { font-weight: bold; }
    .complement { color: #333; font-size: 12px; padding-left: 8px; }
    .total { font-size: 16px; font-weight: bold; }
    .notes-box { border: 1px dashed #000; padding: 4px 6px; margin-top: 4px; font-size: 12px; }
    .payment-tag { display: inline-block; border: 1px solid #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; margin-top: 2px; }
    @media print {
      body { width: 80mm; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="big">${name}</div>
    <div style="font-size:11px; margin-top:2px;">${now}</div>
  </div>
  <div class="divider-solid"></div>

  <div class="center big">PEDIDO #${order.id}</div>
  <div class="divider"></div>

  <div class="label">Cliente</div>
  <div class="bold">${order.customer || '—'}</div>
  ${order.phone ? `<div>${order.phone}</div>` : ''}

  <div class="label">Endereço</div>
  <div>${address}</div>

  <div class="divider"></div>
  <div class="label">Itens</div>
  ${itemsHtml}
  <div class="divider"></div>

  <div class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal || order.total)}</span></div>
  ${order.deliveryFee > 0 ? `<div class="row"><span>Entrega</span><span>${formatCurrency(order.deliveryFee)}</span></div>` : ''}
  ${order.discount > 0 ? `<div class="row"><span>Desconto${order.coupon ? ' (' + order.coupon.code + ')' : ''}</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
  <div class="divider-solid"></div>
  <div class="row"><span class="total">TOTAL</span><span class="total">${formatCurrency(order.total)}</span></div>

  <div class="label">Pagamento</div>
  <div class="payment-tag">${getPaymentMethodText(order.paymentMethod)}</div>

  ${order.notes && order.notes.trim() ? `
  <div class="label">Observações</div>
  <div class="notes-box">${order.notes}</div>` : ''}

  <div class="divider"></div>
  <div class="center" style="font-size:11px;">Obrigado pela preferência!</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}

const lateOrders = computed(() => orders.value.filter(o => isOrderLate(o)))
const markingLate = ref(false)

const markAllLateAsDelivered = async () => {
  if (markingLate.value) return
  const late = lateOrders.value
  if (late.length === 0) return
  markingLate.value = true
  try {
    await Promise.all(late.map(order =>
      authenticatedFetch(`/api/orders/${order._id}`, {
        method: 'PUT',
        body: { status: 'delivered' }
      }).then(() => { order.status = 'delivered' })
      .catch(() => {})
    ))
    showAlert(`${late.length} pedido(s) marcado(s) como entregue`, 'success')
  } catch {
    showAlert('Erro ao atualizar pedidos', 'error')
  } finally {
    markingLate.value = false
  }
}

const minutesLate = (order) => {
  const created = new Date(order.createdAt).getTime()
  const now = Date.now()
  const elapsedMin = Math.floor((now - created) / 60000)
  let maxMin = 60
  if (order.estimatedTime) {
    const match = order.estimatedTime.match(/(\d+)-(\d+)/)
    if (match) maxMin = parseInt(match[2])
    else {
      const single = order.estimatedTime.match(/(\d+)/)
      if (single) maxMin = parseInt(single[1])
    }
  }
  return elapsedMin - maxMin
}

// Calcular datas baseadas no período
const getDateRange = () => {
  const now = new Date()
  let start = null
  let end = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Fim do dia de hoje
  
  switch (periodFilter.value) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Segunda-feira
      start = new Date(now.getFullYear(), now.getMonth(), diff)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'custom':
      if (startDate.value) {
        start = new Date(startDate.value)
        start.setHours(0, 0, 0, 0)
      }
      if (endDate.value) {
        end = new Date(endDate.value)
        end.setHours(23, 59, 59, 999)
      }
      break
    default:
      return { start: null, end: null }
  }
  
  return { start, end }
}

// Handler para mudança de período
const onPeriodChange = () => {
  if (periodFilter.value !== 'custom') {
    startDate.value = ''
    endDate.value = ''
  }
  loadOrders()
}

// Limpar todos os filtros
const clearFilters = () => {
  statusFilter.value = ''
  periodFilter.value = 'all'
  startDate.value = ''
  endDate.value = ''
  loadOrders()
}

const loadOrders = async (showLoading = true, forceRefresh = false) => {
  try {
    if (showLoading) {
      loading.value = true
    }
    
    // Limpar cache se for refresh forçado (quando nova notificação chega)
    if (forceRefresh) {
      clearCache('/api/orders')
    }
    
    // Construir URL com filtros
    const params = new URLSearchParams()
    params.append('page', '1')
    params.append('limit', '100')
    params.append('_t', Date.now().toString())
    
    if (statusFilter.value) {
      params.append('status', statusFilter.value)
    }
    
    // Adicionar filtros de data
    const dateRange = getDateRange()
    if (dateRange.start) {
      params.append('startDate', dateRange.start.toISOString())
    }
    if (dateRange.end && periodFilter.value !== 'all') {
      params.append('endDate', dateRange.end.toISOString())
    }
    
    const url = `/api/orders?${params.toString()}`
    
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
        subtotal: (order.items || []).reduce((s, i) => s + (i.subtotal ?? i.price * i.quantity ?? 0), 0),
        discount: order.discount ?? 0,
        coupon: order.coupon ?? null,
        deliveryFee: deliveryInfo.deliveryFee || 0,
        paymentMethod: order.paymentMethod || 'dinheiro',
        notes: order.notes || '',
        createdAt: order.createdAt || new Date(),
        estimatedTime: deliveryInfo.estimatedTime || '',
        motoboyNome: order.motoboyNome || '',
        motoboyId: order.motoboyId || '',
        type: order.type || 'delivery', // 'delivery' | 'retirada' | 'balcao'
        attendant: order.attendant || '',
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
// Funções para criar pedido
const openCreateOrderModal = () => {
  showCreateOrderModal.value = true
  // Resetar formulário
  newOrder.value = {
    customerInfo: {
      name: '',
      phone: '',
      email: ''
    },
    deliveryInfo: {
      address: '',
      number: '',
      zipCode: '',
      neighborhood: '',
      city: '',
      deliveryFee: 0
    },
    paymentMethod: 'dinheiro',
    notes: '',
    items: [
      { name: '', quantity: 1, price: 0 }
    ]
  }
}

const closeCreateOrderModal = () => {
  showCreateOrderModal.value = false
}

const addOrderItem = () => {
  newOrder.value.items.push({ name: '', quantity: 1, price: 0 })
}

const removeOrderItem = (index) => {
  if (newOrder.value.items.length > 1) {
    newOrder.value.items.splice(index, 1)
  }
}

const createOrder = async () => {
  try {
    creatingOrder.value = true
    
    // Validar itens
    const validItems = newOrder.value.items
      .filter(item => item.name && item.quantity > 0 && item.price > 0)
      .map(item => ({
        productId: null, // Pedido manual não tem productId
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price,
        complements: []
      }))
    
    if (validItems.length === 0) {
      showError('Adicione pelo menos um item válido ao pedido')
      return
    }
    
    // Calcular total
    const subtotal = validItems.reduce((sum, item) => sum + item.subtotal, 0)
    const deliveryFee = newOrder.value.deliveryInfo.deliveryFee || 0
    const total = subtotal + deliveryFee
    
    const orderData = {
      customerInfo: {
        name: newOrder.value.customerInfo.name.trim(),
        phone: newOrder.value.customerInfo.phone.trim(),
        email: newOrder.value.customerInfo.email?.trim() || ''
      },
      items: validItems,
      deliveryInfo: {
        address: newOrder.value.deliveryInfo.address.trim(),
        number: newOrder.value.deliveryInfo.number?.trim() || '',
        zipCode: newOrder.value.deliveryInfo.zipCode?.trim() || '',
        neighborhood: newOrder.value.deliveryInfo.neighborhood?.trim() || '',
        city: newOrder.value.deliveryInfo.city?.trim() || '',
        complement: '',
        latitude: null,
        longitude: null,
        deliveryFee: deliveryFee,
        deliveryZone: '',
        estimatedTime: ''
      },
      paymentMethod: newOrder.value.paymentMethod,
      notes: newOrder.value.notes?.trim() || '',
      totalAmount: total
    }
    
    await authenticatedFetch('/api/orders', {
      method: 'POST',
      body: orderData
    })
    
    showSuccess('Pedido criado com sucesso!')
    closeCreateOrderModal()
    loadOrders()
  } catch (error) {
    showError(error.data?.message || 'Erro ao criar pedido')
  } finally {
    creatingOrder.value = false
  }
}

// Funções para excluir pedido
const confirmDeleteOrder = (order) => {
  confirmationModal.value = {
    show: true,
    title: 'Excluir Pedido',
    message: `Tem certeza que deseja excluir o pedido #${order.id}? Esta ação não pode ser desfeita.`,
    action: () => deleteOrder(order._id || order.id)
  }
}

const deleteOrder = async (orderId) => {
  try {
    await authenticatedFetch(`/api/orders/${orderId}`, {
      method: 'DELETE'
    })
    
    showSuccess('Pedido excluído com sucesso!')
    loadOrders()
  } catch (error) {
    showError(error.data?.message || 'Erro ao excluir pedido')
  } finally {
    confirmationModal.value.show = false
  }
}

const closeStatusModal = () => {
  showStatusModal.value = false
  orderToUpdate.value = null
  newStatus.value = ''
}

// Função para executar a atualização de status
const performStatusUpdate = async (orderId, newStatus, motoboyId = null, motoboyNome = null) => {
  try {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) {
      console.error('Pedido não encontrado:', orderId)
      showAlert('Pedido não encontrado', 'error')
      return
    }

    const body = { status: newStatus }
    if (motoboyId) {
      body.motoboyId = motoboyId
      body.motoboyNome = motoboyNome
    }

    const response = await authenticatedFetch(`/api/orders/${order._id}`, {
      method: 'PUT',
      body
    })
    
    
    // Atualizar localmente
    order.status = newStatus
    if (motoboyNome) order.motoboyNome = motoboyNome
    if (motoboyId) order.motoboyId = motoboyId
    showAlert(`Status do pedido #${orderId} atualizado para ${getStatusText(newStatus)}`, 'success')

    // Enviar notificação WhatsApp em background (fire-and-forget, não bloqueia UI)
    authenticatedFetch(`/api/orders/${order._id}/notify`, {
      method: 'POST',
      body: { status: newStatus }
    }).catch(() => {}) // falha silenciosa
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    const errorMessage = error.data?.message || error.message || 'Erro ao atualizar status do pedido'
    showAlert(errorMessage, 'error')
  }
}

// Carregar motoboys ativos hoje
const carregarMotoboysAtivos = async () => {
  try {
    const token = localStorage.getItem('auth_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await fetch('/api/motoboys', { headers })
    const todos = await res.json()
    motoboysAtivos.value = todos.filter(m => m.status && m.trabalhouHoje)
  } catch (e) {
    motoboysAtivos.value = []
  }
}

// Função para salvar status editado
const saveStatusEdit = async () => {
  if (!orderToUpdate.value || !newStatus.value) return

  // Se for "saiu para entrega", perguntar o motoboy
  if (newStatus.value === 'out_for_delivery') {
    selectedMotoboyId.value = ''
    selectedMotoboyNome.value = ''
    await carregarMotoboysAtivos()
    showStatusModal.value = false
    showMotoboyModal.value = true
    return
  }

  const orderId = orderToUpdate.value.id
  const currentStatusText = getStatusText(orderToUpdate.value.status, orderToUpdate.value.type)
  const newStatusText = getStatusText(newStatus.value, orderToUpdate.value.type)

  const title = 'Confirmar Alteração de Status'
  const message = `Deseja realmente alterar o status do pedido #${orderId} de "${currentStatusText}" para "${newStatusText}"?`

  showConfirmation(title, message, async () => {
    await performStatusUpdate(orderId, newStatus.value)
    closeStatusModal()
  })
}

// Confirmar entrega com motoboy selecionado
const confirmarComMotoboy = async () => {
  if (!orderToUpdate.value) return
  const orderId = orderToUpdate.value.id
  showMotoboyModal.value = false
  showConfirmation(
    'Confirmar Saída para Entrega',
    `Confirmar que ${selectedMotoboyNome.value || 'motoboy'} irá levar o pedido #${orderId}?`,
    async () => {
      await performStatusUpdate(orderId, 'out_for_delivery', selectedMotoboyId.value, selectedMotoboyNome.value)
      closeStatusModal()
    }
  )
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
onMounted(async () => {
  loadOrders()
  // Carregar nome da loja para comanda
  try {
    const settings = await $fetch('/api/public/settings')
    if (settings?.storeName) storeName.value = settings.storeName
  } catch {}
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

/* Filtros */
.filters-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-date {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.filter-date:focus {
  outline: none;
  border-color: #ff8e24;
  box-shadow: 0 0 0 3px rgba(255, 142, 36, 0.1);
}

.date-range-group {
  grid-column: span 1;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.btn-clear-filters {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-height: 44px;
}

.btn-clear-filters:hover:not(:disabled) {
  background: #e2e8f0;
  color: #334155;
  border-color: #94a3b8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-clear-filters:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-clear-filters:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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

.btn-mark-late {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-mark-late:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-mark-late:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.order-card--late {
  border-color: #f87171 !important;
  box-shadow: 0 0 0 2px #fecaca, 0 4px 16px rgba(220, 38, 38, 0.12) !important;
  animation: pulse-late 2s ease-in-out infinite;
}

@keyframes pulse-late {
  0%, 100% { box-shadow: 0 0 0 2px #fecaca, 0 4px 16px rgba(220, 38, 38, 0.12); }
  50% { box-shadow: 0 0 0 3px #fca5a5, 0 4px 20px rgba(220, 38, 38, 0.22); }
}

.late-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #fca5a5;
  border-radius: 0.75rem 0.75rem 0 0;
}

.order-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--color-primary, #ff8e24);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.order-number-section {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.order-number {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.order-number svg {
  color: var(--color-primary, #ff8e24);
}

.order-id {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.order-date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.order-date svg {
  flex-shrink: 0;
}

.order-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.type-badge.delivery {
  background: #e0f2fe;
  color: #0369a1;
}

.type-badge.retirada {
  background: #f0fdf4;
  color: #16a34a;
}

.type-badge.balcao {
  background: #fef3c7;
  color: #b45309;
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

/* Seções do Pedido */
.order-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.section-label svg {
  flex-shrink: 0;
  color: var(--color-primary, #ff8e24);
}

/* Seção de Cliente */
.customer-section {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.customer-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
}

.customer-phone {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.customer-phone svg {
  flex-shrink: 0;
}

/* Seção de Itens */
.items-section {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
}

.item-quantity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 20px;
  background: var(--color-primary, #ff8e24);
  color: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.5rem;
}

.item-name {
  flex: 1;
  color: #1e293b;
  font-weight: 500;
}

.item-price {
  color: #1e293b;
  font-weight: 600;
  font-size: 0.875rem;
}

.more-items {
  text-align: center;
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
  padding: 0.25rem;
}

/* Seção de Pagamento */
.payment-section {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.info-item svg {
  flex-shrink: 0;
  color: #64748b;
}

.info-label {
  color: #64748b;
  font-weight: 500;
}

.info-value {
  color: #1e293b;
  font-weight: 600;
  text-transform: capitalize;
}

/* Seção de Observações */
.notes-section {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.order-notes {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.8125rem;
}

.order-notes svg {
  flex-shrink: 0;
  color: #94a3b8;
  margin-top: 0.125rem;
}

.notes-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.notes-label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.75rem;
}

.notes-text {
  color: #475569;
  line-height: 1.5;
}

/* Desconto cupom no card */
.order-discount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  color: #16a34a;
  font-size: 0.875rem;
  font-weight: 600;
}
.discount-label-card { display: flex; align-items: center; gap: 0.4rem; }
.coupon-badge-card {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.5rem;
  letter-spacing: 0.04em;
}
.discount-val-card { color: #16a34a; }

/* Seção de Total */
.order-total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.total-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.total-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary, #ff8e24);
}

.order-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  border: 1px solid;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.btn-action svg {
  flex-shrink: 0;
}

.btn-print {
  background: white;
  color: #6366f1;
  border-color: #6366f1;
}

.btn-print:hover {
  background: #6366f1;
  color: white;
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

.btn-create {
  background: var(--color-primary, #ff8e24);
  color: white;
  border: none;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-create:hover {
  background: var(--color-primary-hover, #e67e22);
  transform: translateY(-1px);
}

.btn-edit {
  background: white;
  color: var(--color-primary, #ff8e24);
  border-color: var(--color-primary, #ff8e24);
}

.btn-edit:hover {
  background: var(--color-primary, #ff8e24);
  color: white;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
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

.notes-content {
  margin: 0;
  padding: 0.75rem;
  background: #f8fafc;
  border-left: 3px solid #ff8e24;
  border-radius: 0.375rem;
  color: #64748b;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  width: 100%;
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
  padding: 1rem;
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

/* Motoboy modal */
.motoboy-list { display: flex; flex-direction: column; gap: 0.5rem; }

.motoboy-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.15s;
}
.motoboy-option:hover { background: #f0f4ff; border-color: #c7d2fe; }
.motoboy-option.selected { background: #eff6ff; border-color: var(--color-primary); }

.motoboy-opt-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  overflow: hidden;
  flex-shrink: 0;
}
.motoboy-opt-avatar img { width: 100%; height: 100%; object-fit: cover; }
.motoboy-opt-nome { font-weight: 500; font-size: 0.95rem; }

.motoboy-empty {
  text-align: center;
  padding: 1.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.6;
}

.motoboy-info-item { margin-top: 0.25rem; }
.motoboy-name {
  font-weight: 600;
  color: var(--color-primary);
}
.motoboy-empty-name {
  color: #9ca3af;
  font-style: italic;
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
  top: 1rem;
  right: 1rem;
  left: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .alert {
    top: 2rem;
    right: 2rem;
    left: auto;
    margin: 0;
  }
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
  
  .filters-section {
    padding: 1rem;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .date-range-group {
    grid-column: span 1;
  }
  
  .filter-actions {
    align-items: stretch;
  }
  
  .btn-clear-filters {
    width: 100%;
  }
  
  .orders-grid {
    grid-template-columns: 1fr;
  }
}

/* Modal de Criar Pedido */
.create-order-modal {
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.create-order-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.order-items-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item-row {
  display: grid;
  grid-template-columns: 2fr 80px 120px auto;
  gap: 0.5rem;
  align-items: center;
}

.item-name-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.item-qty-input,
.item-price-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  text-align: center;
}

.btn-remove-item {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  width: 44px;
  height: 44px;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  line-height: 1;
}

.btn-remove-item:hover {
  background: #dc2626;
  color: white;
}

.btn-add-item {
  background: #f0f9ff;
  color: var(--color-primary, #ff8e24);
  border: 1px dashed var(--color-primary, #ff8e24);
  padding: 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: var(--color-primary, #ff8e24);
  color: white;
}

@media (max-width: 1200px) {
  .orders-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .orders-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .order-item-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
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
