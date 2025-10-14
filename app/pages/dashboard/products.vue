<template>
  <div class="products-page">
    <!-- Header com informações -->
    <div class="page-header">
      <div class="header-left">
        <h1>Gerenciar Produtos</h1>
        <p class="page-description">Adicione e gerencie os produtos do seu cardápio com fotos, preços e descrições</p>
      </div>
      <button 
        @click="showCreateModal = true" 
        class="btn-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Novo Produto
      </button>
    </div>

    <!-- Info Banner -->
    <div class="info-banner">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>Adicione <strong>imagens atrativas</strong> e <strong>descrições detalhadas</strong> para aumentar as vendas</span>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-header">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filtrar Produtos
        </h3>
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
      </div>
      
      <div class="filters-grid">
        <div class="filter-group">
          <label for="categoryFilter">
            Categoria
          </label>
          <select id="categoryFilter" v-model="selectedCategory" @change="loadProducts" class="filter-select">
            <option value="">Todas as categorias</option>
            <option v-for="category in categories" :key="category._id" :value="category._id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="searchFilter">
            Buscar
          </label>
          <div class="search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              id="searchFilter"
              v-model="searchTerm"
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
          <select id="sortFilter" v-model="sortBy" @change="loadProducts" class="filter-select">
            <option value="name">Nome (A-Z)</option>
            <option value="name-desc">Nome (Z-A)</option>
            <option value="price">Preço (Menor primeiro)</option>
            <option value="price-desc">Preço (Maior primeiro)</option>
            <option value="createdAt">Mais recente</option>
            <option value="createdAt-desc">Mais antigo</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="priceRange">
            Preço Máximo
          </label>
          <div class="price-range">
            <span class="price-prefix">R$</span>
            <input
              id="priceRange"
              v-model.number="maxPrice"
              @input="debouncedSearch"
              type="number"
              placeholder="Ex: 50.00"
              class="price-input"
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </div>
      
      <div class="filter-results" v-if="hasActiveFilters || filteredProducts.length > 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="results-count">
          <strong>{{ filteredProducts.length }}</strong> {{ filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados' }}
        </span>
      </div>
    </div>

    <!-- Lista de Produtos -->
    <div class="products-list">
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
      
      <div v-else-if="products.length === 0" class="empty-state fade-in">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 3h18l-2 14H5L3 3z"></path>
            <path d="M8 21h8"></path>
          </svg>
        </div>
        <h3>Nenhum produto encontrado</h3>
        <p>Crie seu primeiro produto para o menu</p>
        <button @click="showCreateModal = true" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Criar Primeiro Produto
        </button>
      </div>

      <div v-else-if="filteredProducts.length === 0 && products.length > 0" class="empty-state fade-in">
        <div class="empty-icon-emoji">🔍</div>
        <h3>Nenhum resultado encontrado</h3>
        <p v-if="searchTerm">Não encontramos produtos com "{{ searchTerm }}"</p>
        <p v-else-if="selectedCategory">Nenhum produto nesta categoria com os filtros aplicados</p>
        <p v-else>Nenhum produto encontrado com os filtros aplicados</p>
        <button @click="clearFilters" class="btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Limpar Filtros
        </button>
      </div>

      <div v-else class="products-grid">
        <div v-for="product in filteredProducts" :key="product._id" class="product-card hover-lift fade-in">
          <div class="product-image" @click="openImageOverlay(product.image)" style="cursor: pointer;">
            <img :src="product.image" :alt="product.name" loading="lazy" />
          </div>
          <div class="product-info">
            <div class="product-header">
              <h3>{{ product.name }}</h3>
              <span class="category-badge">{{ getCategoryName(product.categoryId) }}</span>
            </div>
            <p v-if="product.description" class="product-description">{{ product.description }}</p>
            <p v-else class="product-description no-description">Sem descrição</p>
            <div class="product-details">
              <div class="price-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span class="price">R$ {{ product.price.toFixed(2) }}</span>
              </div>
            </div>
            <span class="created-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              Criado em {{ formatDate(product.createdAt) }}
            </span>
          </div>
          <div class="product-actions">
            <button 
              @click="editProduct(product)" 
              class="btn-edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span class="btn-text">Editar</span>
            </button>
            <button 
              @click="deleteProduct(product._id)" 
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

    <!-- Modal de Criar/Editar Produto -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div>
            <h2>{{ showEditModal ? 'Editar Produto' : 'Novo Produto' }}</h2>
            <p class="modal-subtitle">
              {{ showEditModal ? 'Atualize as informações do produto' : 'Adicione um novo item ao seu cardápio' }}
            </p>
          </div>
          <button @click="closeModal" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="submitProduct" class="modal-form">
          <div class="form-group">
            <label for="productName">
              Nome do Produto *
            </label>
            <input
              id="productName"
              v-model="productForm.name"
              type="text"
              placeholder="Ex: Hambúrguer Artesanal"
              required
              maxlength="100"
              :disabled="submitting"
            />
            <span class="char-count">{{ productForm.name.length }}/100</span>
          </div>
          
          <div class="form-group">
            <label for="productDescription">
              Descrição (Opcional)
            </label>
            <textarea
              id="productDescription"
              v-model="productForm.description"
              placeholder="Ex: Pão brioche, 180g de carne, queijo, alface e tomate"
              rows="3"
              maxlength="300"
              :disabled="submitting"
            ></textarea>
            <span class="char-count">{{ productForm.description.length }}/300</span>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="productPrice">
                Preço (R$) *
              </label>
              <input
                id="productPrice"
                v-model="productForm.price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                :disabled="submitting"
              />
            </div>
            
            <div class="form-group">
              <label for="productCategory">
                Categoria *
              </label>
              <select
                id="productCategory"
                v-model="productForm.categoryId"
                required
                :disabled="submitting"
              >
                <option value="">Selecione uma categoria</option>
                <option v-for="category in categories" :key="category._id" :value="category._id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="productImage">Imagem do Produto</label>
            <div class="image-preview-wrapper">
              <img 
                :src="productForm.image || '/not_found.jpg'" 
                alt="Preview" 
                class="image-preview product-image-preview"
                @click="openImageOverlay(productForm.image)"
                style="cursor: pointer;"
              />
              <div class="image-info">
                <p>Recomendado: 400x400px</p>
                <p>Formato: JPG, PNG, WEBP</p>
                <p>Máximo: 5MB</p>
              </div>
            </div>
            <div class="upload-buttons">
              <label class="btn-upload">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                  :disabled="uploadingImage"
                  style="display: none"
                />
                <span v-if="uploadingImage" class="loading-spinner-inline"></span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {{ uploadingImage ? 'Enviando...' : 'Fazer Upload' }}
              </label>
              <span class="or-divider">ou</span>
              <input
                id="productImage"
                v-model="productForm.image"
                type="url"
                placeholder="Cole uma URL"
                class="url-input"
                :disabled="submitting"
              />
            </div>
          </div>
          
          <!-- Complementos -->
          <div class="form-group">
            <label>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 6px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Complementos (Opcional)
            </label>
            <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; margin-bottom: 0.75rem;">
              Adicione opções extras que o cliente pode escolher (ex: Bacon, Queijo Extra, Molhos)
            </p>
            
            <div v-for="(complement, index) in productForm.complements" :key="index" class="complement-item">
              <div class="complement-fields">
                <input
                  v-model="complement.name"
                  type="text"
                  placeholder="Nome (ex: Bacon Extra)"
                  maxlength="50"
                  :disabled="submitting"
                  class="complement-name"
                />
                <input
                  v-model="complement.price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Preço (R$)"
                  :disabled="submitting"
                  class="complement-price"
                />
                <button
                  type="button"
                  @click="removeComplement(index)"
                  class="btn-remove-complement"
                  :disabled="submitting"
                  title="Remover complemento"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            
            <button
              type="button"
              @click="addComplement"
              class="btn-add-complement"
              :disabled="submitting"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Adicionar Complemento
            </button>
          </div>
          
          <div class="form-group">
            <label for="productOrder">Ordem de Exibição</label>
            <input
              id="productOrder"
              v-model.number="productForm.order"
              type="number"
              min="0"
              placeholder="0"
              :disabled="submitting"
            />
            <small>Números menores aparecem primeiro na categoria</small>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary" :disabled="submitting">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting">Salvando...</span>
              <span v-else>{{ showEditModal ? 'Atualizar' : 'Criar' }} Produto</span>
            </button>
          </div>
        </form>
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
          <p>Tem certeza que deseja excluir o produto <strong>"{{ productToDelete?.name }}"</strong>?</p>
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
      <span>{{ alert.message }}</span>
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
import { ref, onMounted, onUnmounted } from 'vue'
import ImageOverlay from '~/components/ImageOverlay.vue'
import { useImageOverlay } from '~/composables/useImageOverlay'

// Image overlay
const { showImageOverlay, currentImageUrl, openImageOverlay, closeImageOverlay } = useImageOverlay()

// Definir layout
definePageMeta({
  layout: 'dashboard'
})

// Estado da página
const loading = ref(true)
const products = ref([])
const categories = ref([])
const selectedCategory = ref('')
const searchTerm = ref('')
const sortBy = ref('name')
const maxPrice = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const uploadingImage = ref(false)
const editingProduct = ref(null)
const productToDelete = ref(null)

// Formulário
const productForm = ref({
  name: '',
  description: '',
  price: '',
  image: '',
  categoryId: '',
  order: 0,
  complements: []
})

// Alert
const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

// Computed properties para filtros
const filteredProducts = computed(() => {
  let filtered = [...products.value]
  
  // Filtro por categoria
  if (selectedCategory.value) {
    filtered = filtered.filter(product => product.categoryId === selectedCategory.value)
  }
  
  // Filtro por busca
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(search) ||
      (product.description && product.description.toLowerCase().includes(search))
    )
  }
  
  // Filtro por preço máximo
  if (maxPrice.value && maxPrice.value > 0) {
    filtered = filtered.filter(product => product.price <= maxPrice.value)
  }
  
  // Ordenação
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'price':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      case 'createdAt':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'createdAt-desc':
        return new Date(a.createdAt) - new Date(b.createdAt)
      default:
        return 0
    }
  })
  
  return filtered
})

const hasActiveFilters = computed(() => {
  return selectedCategory.value || searchTerm.value || maxPrice.value || sortBy.value !== 'name'
})

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // A filtragem é reativa através do computed
  }, 300)
}

// Limpar filtros
const clearFilters = () => {
  selectedCategory.value = ''
  searchTerm.value = ''
  maxPrice.value = ''
  sortBy.value = 'name'
}

// Carregar categorias
const loadCategories = async () => {
  try {
    const response = await $fetch('/api/categories')
    categories.value = response
  } catch (error) {
    showAlert('Erro ao carregar categorias', 'error')
  }
}

// Carregar produtos
const loadProducts = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/products')
    
    // Debug: verificar complementos nos produtos
    response.forEach(product => {
      if (product.complements && product.complements.length > 0) {
        console.log(`Produto "${product.name}" tem ${product.complements.length} complementos:`, product.complements)
      }
    })
    
    products.value = response
  } catch (error) {
    showAlert('Erro ao carregar produtos', 'error')
  } finally {
    loading.value = false
  }
}

// Criar produto
const createProduct = async () => {
  try {
    submitting.value = true
    const response = await $fetch('/api/products', {
      method: 'POST',
      body: productForm.value
    })
    
    products.value.unshift(response.product)
    showAlert('Produto criado com sucesso!', 'success')
    closeModal()
  } catch (error) {
    showAlert(error.data?.message || 'Erro ao criar produto', 'error')
  } finally {
    submitting.value = false
  }
}

// Editar produto
const editProduct = (product) => {
  editingProduct.value = product
  
  // Garantir que complementos seja sempre um array
  const complements = Array.isArray(product.complements) 
    ? product.complements.map(comp => ({
        name: comp.name || '',
        price: comp.price || ''
      }))
    : []
  
  console.log('Editando produto:', product.name, 'Complementos:', complements)
  
  productForm.value = {
    name: product.name,
    description: product.description || '',
    price: product.price.toString(),
    image: product.image || '',
    categoryId: product.categoryId,
    order: product.order || 0,
    complements: complements
  }
  showEditModal.value = true
}

// Atualizar produto
const updateProduct = async () => {
  try {
    submitting.value = true
    const response = await $fetch(`/api/products/${editingProduct.value._id}`, {
      method: 'PUT',
      body: productForm.value
    })
    
    const index = products.value.findIndex(p => p._id === editingProduct.value._id)
    if (index !== -1) {
      products.value[index] = response.product
    }
    
    showAlert('Produto atualizado com sucesso!', 'success')
    closeModal()
  } catch (error) {
    showAlert(error.data?.message || 'Erro ao atualizar produto', 'error')
  } finally {
    submitting.value = false
  }
}

// Excluir produto
const deleteProduct = (productId) => {
  const product = products.value.find(p => p._id === productId)
  if (product) {
    productToDelete.value = product
    showDeleteModal.value = true
  }
}

// Confirmar exclusão
const confirmDelete = async () => {
  if (!productToDelete.value) return
  
  try {
    deleting.value = true
    await $fetch(`/api/products/${productToDelete.value._id}`, {
      method: 'DELETE'
    })
    
    products.value = products.value.filter(p => p._id !== productToDelete.value._id)
    showAlert('Produto excluído com sucesso!', 'success')
    showDeleteModal.value = false
    productToDelete.value = null
  } catch (error) {
    showAlert(error.data?.message || 'Erro ao excluir produto', 'error')
  } finally {
    deleting.value = false
  }
}

// Submeter formulário
const submitProduct = () => {
  if (showEditModal.value) {
    updateProduct()
  } else {
    createProduct()
  }
}

// Fechar modal
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingProduct.value = null
  productForm.value = {
    name: '',
    description: '',
    price: '',
    image: '',
    categoryId: '',
    order: 0,
    complements: []
  }
}

// Gerenciar complementos
const addComplement = () => {
  productForm.value.complements.push({
    name: '',
    price: ''
  })
}

const removeComplement = (index) => {
  productForm.value.complements.splice(index, 1)
}

// Handle image upload
const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Validar tipo de arquivo
  if (!file.type.startsWith('image/')) {
    showAlert('Por favor, selecione uma imagem válida', 'error')
    return
  }
  
  // Validar tamanho (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAlert('Imagem muito grande. Máximo 5MB', 'error')
    return
  }
  
  try {
    uploadingImage.value = true
    
    // Converter para base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result
        
        // Fazer upload
        const response = await $fetch('/api/upload-image', {
          method: 'POST',
          body: {
            image: base64,
            filename: file.name,
            type: 'product'
          }
        })
        
        // Atualizar formulário com a imagem
        productForm.value.image = response.imageUrl
        
        showAlert('Imagem carregada com sucesso!', 'success')
      } catch (error) {
        showAlert(error.data?.message || 'Erro ao fazer upload', 'error')
      } finally {
        uploadingImage.value = false
      }
    }
    
    reader.onerror = () => {
      showAlert('Erro ao ler o arquivo', 'error')
      uploadingImage.value = false
    }
    
    reader.readAsDataURL(file)
  } catch (error) {
    showAlert('Erro ao processar imagem', 'error')
    uploadingImage.value = false
  }
}

// Mostrar alert
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

// Formatar data
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Obter nome da categoria
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c._id === categoryId)
  return category ? category.name : 'Categoria não encontrada'
}

// Lifecycle
// Fechar modal com ESC
const handleEscKey = (event) => {
  if (event.key === 'Escape') {
    if (showDeleteModal.value) {
      showDeleteModal.value = false
    } else if (showCreateModal.value || showEditModal.value) {
      closeModal()
    }
  }
}

onMounted(() => {
  loadCategories()
  loadProducts()
  window.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.products-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
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

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.header-left {
  flex: 1;
}

.header-left h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

/* Info Banner */
.info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  border-left: 4px solid #3b82f6;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  color: #1e40af;
  font-size: 0.9375rem;
}

.info-banner svg {
  flex-shrink: 0;
  color: #3b82f6;
}

.info-banner strong {
  font-weight: 700;
}

/* Filters Improvements */
.filters-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
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

.price-prefix {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-weight: 500;
}

.price-input {
  padding-left: 2.5rem !important;
}

/* Product Cards Improvements */
.product-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.category-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.product-description {
  color: #6b7280;
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description.no-description {
  color: #9ca3af;
  font-style: italic;
}

.price-wrapper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.price-wrapper svg {
  color: #059669;
}

.btn-text {
  display: inline;
}

.created-date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.created-date svg {
  color: #9ca3af;
}

/* Modal Improvements */
.modal-subtitle {
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.label-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #e5e7eb;
  color: #6b7280;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: help;
  margin-left: 0.25rem;
  transition: all 0.2s;
}

.label-help:hover {
  background: #3b82f6;
  color: white;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #b91c1c;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.filters-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background: #e5e7eb;
  color: #374151;
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

.filter-select, .search-input, .price-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;
}

.filter-select:focus, .search-input:focus, .price-input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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

.price-range {
  position: relative;
}

.price-label {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 0.875rem;
  pointer-events: none;
}

.price-input {
  padding-right: 2.5rem;
}

.filter-results {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.results-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.loading {
  padding: 2rem 0;
}

.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 1.5rem;
}

.product-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.product-info p {
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #dc2626;
}

.category {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.created-date {
  font-size: 0.875rem;
  color: #9ca3af;
}

.product-actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.btn-edit, .btn-delete {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: white;
  color: #dc2626;
  border-color: #dc2626;
}

.btn-edit:hover {
  background: #dc2626;
  color: white;
}

.btn-delete {
  background: white;
  color: #dc2626;
  border-color: #dc2626;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
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

/* Image Upload Styles */
.image-preview-wrapper {
  margin-bottom: 1rem;
  border: 2px dashed #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  text-align: center;
}

.image-preview {
  width: 100%;
  max-width: 300px;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}

.product-image-preview {
  max-width: 250px;
  aspect-ratio: 1;
  object-fit: cover;
}

.image-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.image-info p {
  margin: 0.25rem 0;
}

.upload-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary, #ff8e24);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-upload:hover:not(:disabled) {
  background: var(--color-primary-hover, #e67e22);
  transform: translateY(-1px);
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.or-divider {
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
}

.url-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
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
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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

@media (max-width: 1024px) {
  .products-page {
    padding: 1.5rem;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .products-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .product-card {
    margin-bottom: 0;
  }
  
  .product-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-edit, .btn-delete {
    justify-content: center;
    width: 100%;
  }
  
  .upload-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-upload {
    width: 100%;
    justify-content: center;
  }
  
  .or-divider {
    text-align: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
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
}

/* Estilos para complementos */
.complement-item {
  margin-bottom: 0.75rem;
}

.complement-fields {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.complement-name {
  flex: 2;
  min-width: 200px;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.complement-name:focus {
  outline: none;
  border-color: #FF6B35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.complement-price {
  flex: 0 0 140px;
  width: 140px;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.complement-price:focus {
  outline: none;
  border-color: #FF6B35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.btn-remove-complement {
  padding: 0.75rem;
  background-color: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-complement:hover {
  background-color: #fecaca;
  transform: scale(1.05);
}

.btn-add-complement {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-add-complement:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.btn-add-complement svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 640px) {
  .products-page {
    padding: 0.75rem;
  }
  
  .complement-fields {
    flex-wrap: wrap;
  }
  
  .complement-name {
    width: 100%;
    min-width: auto;
    flex: none;
  }
  
  .complement-price {
    flex: 1 1 auto;
    min-width: 120px;
  }
  
  .btn-remove-complement {
    flex: 0 0 auto;
  }
  
  .page-header h1 {
    font-size: 1.25rem;
  }
  
  .btn-primary {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
  
  .filters-section {
    padding: 0.75rem;
  }
  
  .filter-group label {
    font-size: 0.875rem;
  }
  
  .filter-select, .search-input, .price-input {
    padding: 0.625rem;
    font-size: 0.875rem;
  }
  
  .product-info {
    padding: 1rem;
  }
  
  .product-info h3 {
    font-size: 1.125rem;
  }
  
  .product-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .modal {
    width: 100%;
    margin: 0.5rem;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-form {
    padding: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .products-page {
    padding: 0.5rem;
  }
  
  .page-header {
    padding: 0.75rem 0;
  }
  
  .page-header h1 {
    font-size: 1.125rem;
  }
  
  .filters-section {
    padding: 0.5rem;
  }
  
  .filters-header h3 {
    font-size: 1rem;
  }
  
  .product-card {
    border-radius: 0.5rem;
  }
  
  .product-image {
    height: 150px;
  }
  
  .product-info {
    padding: 0.75rem;
  }
  
  .product-info h3 {
    font-size: 1rem;
  }
  
  .price {
    font-size: 1.125rem;
  }
  
  .modal {
    margin: 0.25rem;
    border-radius: 0.5rem;
  }
  
  .modal-header {
    padding: 0.75rem;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
  }
  
  .modal-form {
    padding: 0.75rem;
  }
  
  .form-group label {
    font-size: 0.875rem;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
  
  .btn-primary, .btn-secondary {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
