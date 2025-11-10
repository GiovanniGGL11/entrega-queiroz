<template>
  <div class="inventory-page">
    <!-- Header com informações -->
    <div class="page-header">
      <div class="header-left">
        <h1>Controle de Estoque</h1>
        <p class="page-description">Gerencie o estoque dos seus produtos com controle profissional</p>
      </div>
      <div class="header-actions">
        <button 
          @click="showCreateModal = true" 
          class="btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo Controle
        </button>
        <button 
          @click="showReportsModal = true" 
          class="btn-secondary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          Relatórios
        </button>
      </div>
    </div>

    <!-- Cards de Resumo -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3h18l-2 14H5L3 3z"></path>
            <path d="M8 21h8"></path>
          </svg>
        </div>
        <div class="card-content">
          <h3>{{ summary.totalProducts }}</h3>
          <p>Produtos Controlados</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon low-stock">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="card-content">
          <h3>{{ summary.lowStockItems }}</h3>
          <p>Estoque Baixo</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon out-of-stock">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <div class="card-content">
          <h3>{{ summary.outOfStockItems }}</h3>
          <p>Sem Estoque</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="card-content">
          <h3>R$ {{ summary.totalValue.toFixed(2) }}</h3>
          <p>Valor Total</p>
        </div>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alerts.lowStock.length > 0 || alerts.outOfStock.length > 0" class="alerts-section">
      <h3>Alertas de Estoque</h3>
      <div class="alerts-grid">
        <div v-for="alert in alerts.lowStock" :key="alert.id" class="alert-card warning">
          <div class="alert-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="alert-content">
            <h4>{{ alert.productName }}</h4>
            <p>Estoque baixo: {{ alert.currentStock }} / {{ alert.minStock }}</p>
            <small>Faltam {{ alert.difference }} unidades</small>
          </div>
          <button @click="openMovementModal(alert.id, 'entrada')" class="btn-small">
            Repor
          </button>
        </div>

        <div v-for="alert in alerts.outOfStock" :key="alert.id" class="alert-card error">
          <div class="alert-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div class="alert-content">
            <h4>{{ alert.productName }}</h4>
            <p>Produto sem estoque</p>
            <small>Estoque mínimo: {{ alert.minStock }}</small>
          </div>
          <button @click="openMovementModal(alert.id, 'entrada')" class="btn-small">
            Repor
          </button>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-header">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filtrar Estoque
        </h3>
        <div class="filters-actions">
          <button 
            @click="clearFilters" 
            class="clear-filters-btn" 
            v-if="hasActiveFilters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Limpar Filtros
          </button>
          <button @click="loadInventory" class="btn-refresh" :disabled="loading">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            {{ loading ? 'Carregando...' : 'Atualizar' }}
          </button>
        </div>
      </div>
      
      <div class="filters-grid">
        <div class="filter-group">
          <label for="statusFilter">
            Status do Estoque
          </label>
          <select id="statusFilter" v-model="filters.status" @change="debouncedSearch" class="filter-select">
            <option value="">Todos</option>
            <option value="normal">Estoque Normal</option>
            <option value="low">Estoque Baixo</option>
            <option value="out">Sem Estoque</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="searchFilter">
            Buscar Produto
          </label>
          <div class="search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              id="searchFilter"
              v-model="filters.search"
              @input="debouncedSearch"
              type="text"
              placeholder="Ex: Hambúrguer, Pizza..."
              class="search-input"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label for="sortFilter">
            Ordenar por
          </label>
          <select id="sortFilter" v-model="filters.sortBy" @change="debouncedSearch" class="filter-select">
            <option value="productName">Nome (A-Z)</option>
            <option value="productName-desc">Nome (Z-A)</option>
            <option value="currentStock">Estoque (Menor primeiro)</option>
            <option value="currentStock-desc">Estoque (Maior primeiro)</option>
            <option value="lastUpdated">Última Atualização</option>
          </select>
        </div>
      </div>
      
      <div class="filter-results" v-if="hasActiveFilters || filteredInventory.length > 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="results-count">
          <strong>{{ filteredInventory.length }}</strong> {{ filteredInventory.length === 1 ? 'item encontrado' : 'itens encontrados' }}
        </span>
      </div>
    </div>

    <!-- Lista de Estoque -->
    <div class="inventory-list">
      <div v-if="loading" class="loading">
        <div class="loading-skeleton">
          <div class="skeleton-card" v-for="n in 6" :key="n">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-price"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="inventory.length === 0" class="empty-state fade-in">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 3h18l-2 14H5L3 3z"></path>
            <path d="M8 21h8"></path>
          </svg>
        </div>
        <h3>Nenhum controle de estoque encontrado</h3>
        <p>Crie o primeiro controle de estoque para seus produtos</p>
        <button @click="showCreateModal = true" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Criar Primeiro Controle
        </button>
      </div>

      <div v-else-if="filteredInventory.length === 0 && inventory.length > 0" class="empty-state fade-in">
        <div class="empty-icon-emoji">🔍</div>
        <h3>Nenhum resultado encontrado</h3>
        <p v-if="filters.search">Não encontramos produtos com "{{ filters.search }}"</p>
        <p v-else>Nenhum item encontrado com os filtros aplicados</p>
        <button @click="clearFilters" class="btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Limpar Filtros
        </button>
      </div>

      <div v-else class="inventory-grid">
        <div v-for="item in filteredInventory" :key="item._id" class="inventory-card hover-lift fade-in">
          <div class="inventory-image" @click="openImageOverlay(item.product?.image)" style="cursor: pointer;">
            <img :src="item.product?.image || '/not_found.jpg'" :alt="item.productName" loading="lazy" />
            <div class="stock-badge" :class="getStockStatus(item.currentStock, item.minStock)">
              {{ getStockStatusText(item.currentStock, item.minStock) }}
            </div>
          </div>
          <div class="inventory-info">
            <div class="inventory-header">
              <h3>{{ item.productName || 'Produto sem nome' }}</h3>
              <span class="cost-price">Custo: R$ {{ (item.costPrice || 0).toFixed(2) }}</span>
            </div>
            
            <div class="stock-info">
              <div class="stock-current">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3h18l-2 14H5L3 3z"></path>
                  <path d="M8 21h8"></path>
                </svg>
                <span class="stock-number">{{ item.currentStock || 0 }}</span>
                <span class="stock-label">unidades</span>
              </div>
              
              <div class="stock-limits">
                <div class="limit-item">
                  <span class="limit-label">Mín:</span>
                  <span class="limit-value">{{ item.minStock || 0 }}</span>
                </div>
                <div class="limit-item">
                  <span class="limit-label">Máx:</span>
                  <span class="limit-value">{{ item.maxStock || 0 }}</span>
                </div>
              </div>
            </div>
            
            <div class="inventory-stats">
              <div class="stat-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                <span>{{ item.totalSold || 0 }} vendidos</span>
              </div>
              <div class="stat-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="17" y1="11" x2="23" y2="11"></line>
                </svg>
                <span>{{ item.totalPurchased || 0 }} comprados</span>
              </div>
            </div>
            
            <div class="last-updated" v-if="item.lastUpdated">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              Atualizado em {{ formatDate(item.lastUpdated) }}
            </div>
          </div>
          <div class="inventory-actions">
            <button 
              @click="editInventory(item)" 
              class="btn-edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span class="btn-text">Editar</span>
            </button>
            <button 
              @click="adjustStock(item)" 
              class="btn-adjust"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span class="btn-text">Ajustar</span>
            </button>
            <button 
              @click="deleteInventory(item._id)" 
              class="btn-delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
              <span class="btn-text">Excluir</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Criar/Editar Estoque -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div>
            <h2>{{ showEditModal ? 'Editar Controle de Estoque' : 'Novo Controle de Estoque' }}</h2>
            <p class="modal-subtitle">
              {{ showEditModal ? 'Atualize as informações do controle de estoque' : 'Configure o controle de estoque para um produto' }}
            </p>
          </div>
          <button @click="closeModal" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="submitInventory" class="modal-form">
          <div class="form-group">
            <label for="productSelect">
              Produto *
            </label>
            <select
              id="productSelect"
              v-model="createForm.productId"
              required
              :disabled="submitting || showEditModal"
            >
              <option value="">Selecione um produto</option>
              <option v-for="product in availableProducts" :key="product._id" :value="product._id">
                {{ product.name }}
              </option>
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="initialStock">
                Estoque Inicial *
              </label>
              <input
                id="initialStock"
                v-model.number="createForm.initialStock"
                type="number"
                min="0"
                placeholder="0"
                required
                :disabled="submitting"
              />
            </div>
            
            <div class="form-group">
              <label for="costPrice">
                Preço de Custo (R$)
              </label>
              <input
                id="costPrice"
                v-model.number="createForm.costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                :disabled="submitting"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="minStock">
                Estoque Mínimo
              </label>
              <input
                id="minStock"
                v-model.number="createForm.minStock"
                type="number"
                min="0"
                placeholder="5"
                :disabled="submitting"
              />
            </div>
            
            <div class="form-group">
              <label for="maxStock">
                Estoque Máximo
              </label>
              <input
                id="maxStock"
                v-model.number="createForm.maxStock"
                type="number"
                min="0"
                placeholder="100"
                :disabled="submitting"
              />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary" :disabled="submitting">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting">Salvando...</span>
              <span v-else>{{ showEditModal ? 'Atualizar' : 'Criar' }} Controle</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Ajuste de Estoque -->
    <div v-if="showAdjustModal" class="modal-overlay" @click="showAdjustModal = false">
      <div class="adjust-modal" @click.stop>
        <div class="modal-header">
          <div>
            <h2>Ajustar Estoque</h2>
            <p class="modal-subtitle">
              {{ adjustingItem?.productName }} - Estoque atual: {{ adjustingItem?.currentStock }}
            </p>
          </div>
          <button @click="showAdjustModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="submitStockAdjustment" class="modal-form">
          <div class="form-group">
            <label for="operation">
              Tipo de Operação *
            </label>
            <select
              id="operation"
              v-model="adjustForm.operation"
              required
              :disabled="submitting"
            >
              <option value="">Selecione a operação</option>
              <option value="add">Entrada de Estoque</option>
              <option value="remove">Saída de Estoque</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="quantity">
              Quantidade *
            </label>
            <input
              id="quantity"
              v-model.number="adjustForm.quantity"
              type="number"
              min="1"
              placeholder="0"
              required
              :disabled="submitting"
            />
          </div>
          
          <div class="form-group">
            <label for="reason">
              Motivo (Opcional)
            </label>
            <textarea
              id="reason"
              v-model="adjustForm.reason"
              placeholder="Ex: Compra de fornecedor, Venda, Ajuste de inventário..."
              rows="3"
              :disabled="submitting"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="showAdjustModal = false" class="btn-secondary" :disabled="submitting">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting">Ajustando...</span>
              <span v-else>Ajustar Estoque</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Movimentação -->
    <div v-if="showMovementModal" class="modal-overlay" @click="showMovementModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Registrar Movimentação</h2>
          <button @click="showMovementModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="product-info">
            <h3>{{ selectedItem?.productName }}</h3>
            <p>Estoque atual: <strong>{{ selectedItem?.currentStock }} unidades</strong></p>
          </div>
          
          <form @submit.prevent="registerMovement">
            <div class="form-group">
              <label for="movementType">Tipo de Movimentação</label>
              <select id="movementType" v-model="movementForm.type" required>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste</option>
                <option value="perda">Perda</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="movementQuantity">Quantidade</label>
              <input
                id="movementQuantity"
                v-model.number="movementForm.quantity"
                type="number"
                min="1"
                required
                placeholder="0"
              />
            </div>
            
            <div class="form-group">
              <label for="movementReason">Motivo</label>
              <input
                id="movementReason"
                v-model="movementForm.reason"
                type="text"
                placeholder="Ex: Compra, Venda, Ajuste..."
                required
              />
            </div>
            
            <div class="form-group">
              <label for="movementCostPrice">Preço de Custo (R$)</label>
              <input
                id="movementCostPrice"
                v-model.number="movementForm.costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            
            <div class="form-group">
              <label for="movementNotes">Observações</label>
              <textarea
                id="movementNotes"
                v-model="movementForm.notes"
                placeholder="Observações adicionais..."
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="showMovementModal = false" class="btn-secondary">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" :disabled="submitting">
                {{ submitting ? 'Registrando...' : 'Registrar Movimentação' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="delete-modal" @click.stop>
        <div class="modal-header">
          <div class="warning-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h2>Confirmar Exclusão</h2>
        </div>
        
        <div class="modal-content">
          <p>Tem certeza que deseja excluir o controle de estoque de <strong>"{{ itemToDelete?.productName }}"</strong>?</p>
          <p class="warning-text">Esta ação não pode ser desfeita.</p>
        </div>
        
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">
            Cancelar
          </button>
          <button @click="confirmDelete" class="btn-delete-confirm" :disabled="deleting">
            <span v-if="deleting">Excluindo...</span>
            <span v-else>Sim, Excluir</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Alert de Sucesso/Erro -->
    <div v-if="alert.show" :class="['alert', alert.type]">
      <div class="alert-icon">
        <svg v-if="alert.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22,4 12,14.01 9,11.01"></polyline>
        </svg>
        <svg v-else-if="alert.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <svg v-else-if="alert.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
      </div>
      <div class="alert-content">
        <div class="alert-message">{{ alert.message }}</div>
      </div>
      <button @click="alert.show = false" class="alert-close">×</button>
    </div>
  </div>

  <!-- Image Overlay -->
  <ImageOverlay
    :show="showImageOverlay"
    :imageUrl="currentImageUrl"
    @close="closeImageOverlay"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import ImageOverlay from '~/components/ImageOverlay.vue'
import { useImageOverlay } from '~/composables/useImageOverlay'
import { useAlert } from '~/composables/useAlert'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

// Image overlay
const { showImageOverlay, currentImageUrl, openImageOverlay, closeImageOverlay } = useImageOverlay()

// Alert system
const { showSuccess, showError, showWarning, showInfo } = useAlert()

// Definir layout
definePageMeta({
  layout: 'dashboard'
})

// Estado da página
const loading = ref(true)
const inventory = ref([])
const categories = ref([])
const products = ref([])

// Dados do relatório
const summary = ref({
  totalProducts: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  totalValue: 0
})

const alerts = ref({
  lowStock: [],
  outOfStock: []
})

// Filtros
const filters = ref({
  status: '',
  category: '',
  search: '',
  sortBy: 'productName'
})

// Modais
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showAdjustModal = ref(false)
const showMovementModal = ref(false)
const showReportsModal = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref(null)
const editingItem = ref(null)
const adjustingItem = ref(null)
const itemToDelete = ref(null)
const submitting = ref(false)
const deleting = ref(false)

// Formulários
const createForm = ref({
  productId: '',
  initialStock: 0,
  minStock: 5,
  maxStock: 100,
  costPrice: 0
})

const editForm = ref({
  currentStock: 0,
  minStock: 5,
  maxStock: 100,
  costPrice: 0
})

const movementForm = ref({
  type: 'entrada',
  quantity: 0,
  reason: '',
  costPrice: 0,
  notes: ''
})

const adjustForm = ref({
  operation: '',
  quantity: 1,
  reason: ''
})

// Alert
const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

// Computed properties
const filteredInventory = computed(() => {
  let filtered = [...inventory.value]
  
  // Filtro por status
  if (filters.value.status) {
    filtered = filtered.filter(item => {
      switch (filters.value.status) {
        case 'normal':
          return item.currentStock > item.minStock
        case 'low':
          return item.currentStock > 0 && item.currentStock <= item.minStock
        case 'out':
          return item.currentStock === 0
        default:
          return true
      }
    })
  }
  
  // Filtro por categoria
  if (filters.value.category) {
    filtered = filtered.filter(item => 
      item.product?.categoryId === filters.value.category
    )
  }
  
  // Filtro por busca
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    filtered = filtered.filter(item => 
      item.productName.toLowerCase().includes(search)
    )
  }
  
  // Ordenação
  filtered.sort((a, b) => {
    switch (filters.value.sortBy) {
      case 'productName':
        const nameA = a.productName || ''
        const nameB = b.productName || ''
        return nameA.localeCompare(nameB)
      case 'productName-desc':
        const nameADesc = a.productName || ''
        const nameBDesc = b.productName || ''
        return nameBDesc.localeCompare(nameADesc)
      case 'currentStock':
        return (a.currentStock || 0) - (b.currentStock || 0)
      case 'currentStock-desc':
        return (b.currentStock || 0) - (a.currentStock || 0)
      case 'minStock':
        return (a.minStock || 0) - (b.minStock || 0)
      case 'lastUpdated':
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0)
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0)
        return dateB - dateA
      default:
        return 0
    }
  })
  
  return filtered
})

const hasActiveFilters = computed(() => {
  return filters.value.status !== '' || 
         filters.value.category !== '' || 
         filters.value.search !== ''
})

const totalProducts = computed(() => inventory.value.length)

const lowStockCount = computed(() => 
  inventory.value.filter(item => item.currentStock > 0 && item.currentStock <= item.minStock).length
)

const outOfStockCount = computed(() => 
  inventory.value.filter(item => item.currentStock === 0).length
)

const totalValue = computed(() => 
  inventory.value.reduce((total, item) => total + (item.currentStock * item.costPrice), 0)
)

const availableProducts = computed(() => {
  const controlledProductIds = inventory.value.map(item => item.productId)
  return products.value.filter(product => !controlledProductIds.includes(product._id))
})

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // A filtragem é reativa através do computed filteredInventory
  }, 300)
}

// Limpar filtros
const clearFilters = () => {
  filters.value = {
    status: '',
    category: '',
    search: '',
    sortBy: 'productName'
  }
}

const { authenticatedFetch } = useAuthenticatedFetch()

// Carregar produtos
const loadProducts = async () => {
  try {
    const response = await authenticatedFetch('/api/products')
    products.value = response
  } catch (error) {
    showError('Erro ao carregar produtos')
  }
}

// Carregar categorias
const loadCategories = async () => {
  try {
    const response = await authenticatedFetch('/api/categories')
    categories.value = response
  } catch (error) {
    console.error('Erro ao carregar categorias:', error)
  }
}

// Abrir modal de movimentação
const openMovementModal = (inventoryId, type = 'entrada') => {
  const item = inventory.value.find(i => i._id === inventoryId)
  if (item) {
    selectedItem.value = item
    movementForm.value = {
      type: type,
      quantity: 0,
      reason: '',
      costPrice: item.costPrice,
      notes: ''
    }
    showMovementModal.value = true
  }
}

// Registrar movimentação
const registerMovement = async () => {
  try {
    submitting.value = true
    
    const response = await authenticatedFetch('/api/inventory/movements', {
      method: 'POST',
      body: {
        inventoryId: selectedItem.value._id,
        type: movementForm.value.type,
        quantity: movementForm.value.quantity,
        reason: movementForm.value.reason,
        costPrice: movementForm.value.costPrice,
        notes: movementForm.value.notes
      }
    })
    
    if (response.success) {
      showSuccess('Movimentação registrada com sucesso')
      showMovementModal.value = false
      loadInventory()
    }
    
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error)
    showError('Erro ao registrar movimentação')
  } finally {
    submitting.value = false
  }
}

// Abrir modal de relatórios
const openReportsModal = () => {
  showReportsModal.value = true
}

// Carregar estoque
const loadInventory = async () => {
  try {
    loading.value = true
    
    // Carregar dados em paralelo
    const [inventoryResponse, reportsResponse] = await Promise.all([
      authenticatedFetch('/api/inventory'),
      authenticatedFetch('/api/inventory/reports')
    ])
    
    inventory.value = inventoryResponse
    summary.value = reportsResponse.summary
    alerts.value = reportsResponse.alerts
    
  } catch (error) {
    console.error('Erro ao carregar estoque:', error)
    showError('Erro ao carregar estoque')
  } finally {
    loading.value = false
  }
}

// Criar controle de estoque
const createInventory = async () => {
  try {
    submitting.value = true
    const response = await authenticatedFetch('/api/inventory', {
      method: 'POST',
      body: createForm.value
    })
    
    inventory.value.unshift(response.inventory)
    showSuccess('Controle de estoque criado com sucesso!')
    closeModal()
  } catch (error) {
    showError(error.data?.message || 'Erro ao criar controle de estoque')
  } finally {
    submitting.value = false
  }
}

// Editar controle de estoque
const editInventory = (item) => {
  editingItem.value = item
  
  editForm.value = {
    productId: item.productId,
    initialStock: item.currentStock,
    minStock: item.minStock,
    maxStock: item.maxStock,
    costPrice: item.costPrice
  }
  showEditModal.value = true
}

// Atualizar controle de estoque
const updateInventory = async () => {
  try {
    submitting.value = true
    const response = await authenticatedFetch(`/api/inventory/${editingItem.value._id}`, {
      method: 'PUT',
      body: {
        currentStock: editForm.value.initialStock,
        minStock: editForm.value.minStock,
        maxStock: editForm.value.maxStock,
        costPrice: editForm.value.costPrice
      }
    })
    
    const index = inventory.value.findIndex(i => i._id === editingItem.value._id)
    if (index !== -1) {
      inventory.value[index] = response.inventory
    }
    
    showSuccess('Controle de estoque atualizado com sucesso!')
    closeModal()
  } catch (error) {
    showError(error.data?.message || 'Erro ao atualizar controle de estoque')
  } finally {
    submitting.value = false
  }
}

// Ajustar estoque
const adjustStock = (item) => {
  adjustingItem.value = item
  adjustForm.value = {
    operation: '',
    quantity: 1,
    reason: ''
  }
  showAdjustModal.value = true
}

// Submeter ajuste de estoque
const submitStockAdjustment = async () => {
  try {
    submitting.value = true
    
    // Validação no frontend
    if (!adjustForm.value.operation) {
      showError('Selecione o tipo de operação')
      return
    }
    
    if (!adjustForm.value.quantity || adjustForm.value.quantity <= 0) {
      showError('Quantidade deve ser maior que zero')
      return
    }
    
    // Garantir que quantity seja um número
    const quantity = parseInt(adjustForm.value.quantity)
    if (isNaN(quantity)) {
      showError('Quantidade deve ser um número válido')
      return
    }
    
    const response = await authenticatedFetch(`/api/inventory/${adjustingItem.value._id}`, {
      method: 'PUT',
      body: {
        operation: adjustForm.value.operation,
        quantity: quantity,
        reason: adjustForm.value.reason
      }
    })
    
    const index = inventory.value.findIndex(i => i._id === adjustingItem.value._id)
    if (index !== -1) {
      inventory.value[index] = response.inventory
    }
    
    showSuccess('Estoque ajustado com sucesso!')
    showAdjustModal.value = false
  } catch (error) {
    console.error('Erro detalhado:', error)
    showError(error.data?.message || 'Erro ao ajustar estoque')
  } finally {
    submitting.value = false
  }
}

// Excluir controle de estoque
const deleteInventory = (itemId) => {
  const item = inventory.value.find(i => i._id === itemId)
  if (item) {
    itemToDelete.value = item
    showDeleteModal.value = true
  }
}

// Confirmar exclusão
const confirmDelete = async () => {
  if (!itemToDelete.value) return
  
  try {
    deleting.value = true
    await authenticatedFetch(`/api/inventory/${itemToDelete.value._id}`, {
      method: 'DELETE'
    })
    
    inventory.value = inventory.value.filter(i => i._id !== itemToDelete.value._id)
    showSuccess('Controle de estoque excluído com sucesso!')
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (error) {
    showError(error.data?.message || 'Erro ao excluir controle de estoque')
  } finally {
    deleting.value = false
  }
}

// Submeter formulário
const submitInventory = () => {
  if (showEditModal.value) {
    updateInventory()
  } else {
    createInventory()
  }
}

// Fechar modal
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingItem.value = null
  createForm.value = {
    productId: '',
    initialStock: 0,
    minStock: 5,
    maxStock: 100,
    costPrice: 0
  }
  editForm.value = {
    productId: '',
    initialStock: 0,
    minStock: 5,
    maxStock: 100,
    costPrice: 0
  }
}

// Utilitários
const getStockStatus = (current, min) => {
  const currentStock = current || 0
  const minStock = min || 0
  if (currentStock === 0) return 'out-of-stock'
  if (currentStock <= minStock) return 'low-stock'
  return 'normal-stock'
}

const getStockStatusText = (current, min) => {
  const currentStock = current || 0
  const minStock = min || 0
  if (currentStock === 0) return 'Sem Estoque'
  if (currentStock <= minStock) return 'Estoque Baixo'
  return 'Normal'
}

// Formatar data
const formatDate = (date) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return 'Data inválida'
  }
}

// Lifecycle
const handleEscKey = (event) => {
  if (event.key === 'Escape') {
    if (showDeleteModal.value) {
      showDeleteModal.value = false
    } else if (showCreateModal.value || showEditModal.value || showAdjustModal.value) {
      closeModal()
      showAdjustModal.value = false
    }
  }
}

onMounted(async () => {
  await Promise.all([
    loadProducts(),
    loadCategories(),
    loadInventory()
  ])
  window.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.inventory-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
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

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-secondary {
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

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
}

.btn-small {
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

.btn-small:hover {
  background: #e67e22;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.4);
}

/* Alerts Section */
.alerts-section {
  margin-bottom: 2rem;
}

.alerts-section h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.alert-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
}

.alert-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

.alert-card.warning {
  background: #ffffff;
  border-color: #f59e0b;
  color: #92400e;
}

.alert-card.error {
  background: #ffffff;
  border-color: #ef4444;
  color: #991b1b;
}

.alert-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert-card.warning .alert-icon {
  background: #f59e0b;
  color: white;
}

.alert-card.error .alert-icon {
  background: #ef4444;
  color: white;
}

.alert-content {
  flex: 1;
}

.alert-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.alert-content p {
  margin: 0 0 0.25rem 0;
  font-size: 0.75rem;
}

.alert-content small {
  font-size: 0.625rem;
  opacity: 0.8;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  background: #ff8e24;
  border-radius: 1rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.3);
  transition: all 0.3s ease;
}

.summary-card:hover .card-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 142, 36, 0.4);
}

.card-icon.low-stock {
  background: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.summary-card:hover .card-icon.low-stock {
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.card-icon.out-of-stock {
  background: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.summary-card:hover .card-icon.out-of-stock {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.card-content h3 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.card-content p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

/* Inventory Cards */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.inventory-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
}

.inventory-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

.inventory-image {
  height: 200px;
  overflow: hidden;
  position: relative;
}

.inventory-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stock-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.stock-badge.normal-stock {
  background: #10b981;
  color: white;
}

.stock-badge.low-stock {
  background: #f59e0b;
  color: white;
}

.stock-badge.out-of-stock {
  background: #ef4444;
  color: white;
}

.inventory-info {
  padding: 1.5rem;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 0.75rem;
}

.inventory-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

.cost-price {
  background: #f8fafc;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid #e2e8f0;
}

.stock-info {
  margin-bottom: 1rem;
}

.stock-current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stock-current svg {
  color: #6b7280;
}

.stock-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stock-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.stock-limits {
  display: flex;
  gap: 1rem;
}

.limit-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.limit-label {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
}

.limit-value {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
}

.inventory-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-item svg {
  color: #9ca3af;
}

.last-updated {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #9ca3af;
  font-size: 0.75rem;
}

.last-updated svg {
  color: #d1d5db;
}

.inventory-actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.btn-edit, .btn-adjust, .btn-delete {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 1px solid;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-edit {
  background: #ffffff;
  color: #ff8e24;
  border-color: #ff8e24;
}

.btn-edit:hover {
  background: #ff8e24;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.4);
}

.btn-adjust {
  background: #ffffff;
  color: #ff8e24;
  border-color: #ff8e24;
}

.btn-adjust:hover {
  background: #ff8e24;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.4);
}

.btn-delete {
  background: #ffffff;
  color: #ef4444;
  border-color: #ef4444;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.btn-text {
  display: inline;
}

/* Modal Adjust */
.adjust-modal {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 1024px) {
  .inventory-page {
    padding: 1.5rem;
  }
  
  .inventory-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .inventory-page {
    padding: 1rem;
  }
  
  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .inventory-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .inventory-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-edit, .btn-adjust, .btn-delete {
    justify-content: center;
    width: 100%;
  }
}

/* Reutilizar estilos existentes do products.vue */
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

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ff8e24;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(255, 142, 36, 0.3);
  white-space: nowrap;
  min-height: 44px;
}

.btn-primary:hover:not(:disabled) {
  background: #e67e22;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(255, 142, 36, 0.3);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.clear-filters-btn:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.filter-select, .search-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;
}

/* Estilo específico para selects */
.filter-select {
  padding-right: calc(0.75rem + 1.5rem); /* Espaço extra para a setinha */
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  appearance: none;
}

.filter-select:focus, .search-input:focus {
  outline: none;
  border-color: #ff8e24;
  box-shadow: 0 0 0 3px rgba(255, 142, 36, 0.1);
}

.search-input-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  padding-left: 2.5rem;
}

.filter-results {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #374151;
}

.filter-results svg {
  color: #6b7280;
  flex-shrink: 0;
}

.filter-results strong {
  font-weight: 700;
  color: #1f2937;
}

.loading {
  padding: 2rem 0;
}

.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-image {
  height: 200px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  padding: 1.5rem;
}

.skeleton-title {
  height: 1.25rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  width: 70%;
}

.skeleton-text {
  height: 1rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  width: 100%;
}

.skeleton-price {
  height: 1.5rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.25rem;
  width: 40%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-icon {
  margin-bottom: 1.5rem;
}

.empty-icon svg {
  color: #d1d5db;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
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
}

.empty-icon-emoji {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
}

.modal {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #ff8e24;
  box-shadow: 0 0 0 3px rgba(255, 142, 36, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled,
.form-group select:disabled {
  background: #f9fafb;
  color: #6b7280;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.alert {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1001;
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
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal de Exclusão */
.delete-modal {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.delete-modal .modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.warning-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #fef2f2;
  border-radius: 50%;
  color: #ef4444;
  flex-shrink: 0;
}

.delete-modal .modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-content {
  padding: 1.5rem;
}

.modal-content p {
  margin: 0 0 1rem 0;
  color: #374151;
  line-height: 1.5;
}

.warning-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.btn-delete-confirm {
  background: #ef4444;
  color: white;
  border: 1px solid #ef4444;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-confirm:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

.btn-delete-confirm:disabled {
  background: #9ca3af;
  border-color: #9ca3af;
  cursor: not-allowed;
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hover-lift {
  transition: transform 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .inventory-page {
    padding: 0.75rem;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
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
  
  .filters-section {
    padding: 1rem;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .filters-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .clear-filters-btn {
    width: 100%;
    justify-content: center;
  }
  
  .loading-skeleton {
    grid-template-columns: 1fr;
  }
  
  .alert {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
  
  .modal {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .delete-modal .modal-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
