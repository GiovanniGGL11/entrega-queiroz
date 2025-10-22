<template>
  <div class="categories-page">
    <!-- Header com informações -->
    <div class="page-header">
      <div class="header-left">
        <h1>Gerenciar Categorias</h1>
        <p class="page-description">Organize o cardápio em categorias como "Hambúrgueres", "Bebidas", "Sobremesas", etc.</p>
      </div>
      <div class="header-actions">
        <div class="sort-info" v-if="isUpdatingOrder">
          <svg class="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <span>Salvando ordem...</span>
        </div>
        <button 
          @click="showCreateModal = true" 
          class="btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nova Categoria
        </button>
      </div>
    </div>

    <!-- Dica de ordenação -->
    <div v-if="categories.length > 1" class="info-banner">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>Arraste as categorias pelo ícone <strong>☰</strong> para mudar a ordem de exibição no cardápio</span>
    </div>

    <!-- Lista de Categorias -->
    <div class="categories-list">
      <div v-if="loading" class="loading">
        <div class="loading-skeleton">
          <div class="skeleton-card" v-for="n in 4" :key="n">
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-date"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="categories.length === 0" class="empty-state fade-in">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 3h18l-2 14H5L3 3z"></path>
            <path d="M8 21h8"></path>
          </svg>
        </div>
        <h3>Nenhuma categoria encontrada</h3>
        <p>Crie sua primeira categoria para organizar o menu</p>
        <button @click="showCreateModal = true" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Criar Primeira Categoria
        </button>
      </div>

      <div v-else class="categories-grid" ref="categoriesContainer">
        <div v-for="category in categories" :key="category._id" class="category-card hover-lift fade-in sortable" :data-id="category._id">
          <div class="drag-handle">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"></path>
              <path d="M3 12h18"></path>
              <path d="M3 18h18"></path>
            </svg>
          </div>
          <div class="category-info">
            <div class="category-name-wrapper">
              <h3>{{ category.name }}</h3>
              <div class="category-badges">
                <span class="item-badge">{{ category.itemCount || 0 }} {{ category.itemCount === 1 ? 'item' : 'itens' }}</span>
                <span :class="['visibility-badge', category.isVisible !== false ? 'visible' : 'hidden']">
                  {{ category.isVisible !== false ? 'Visível' : 'Oculta' }}
                </span>
              </div>
            </div>
            <p v-if="category.description" class="category-description">{{ category.description }}</p>
            <p v-else class="category-description no-description">Sem descrição</p>
            
            
            <span class="created-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              Criada em {{ formatDate(category.createdAt) }}
            </span>
          </div>
          <div class="category-actions">
            <button 
              @click="editCategory(category)" 
              class="btn-edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span class="btn-text">Editar</span>
            </button>
            <button 
              @click="deleteCategory(category._id)" 
              class="btn-delete"
              :title="category.itemCount > 0 ? `Excluir categoria (${category.itemCount} produto(s) associado(s))` : 'Excluir categoria'"
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

    <!-- Modal de Criar/Editar Categoria -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div>
            <h2>{{ showEditModal ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
            <p class="modal-subtitle">
              {{ showEditModal ? 'Atualize as informações da categoria' : 'Crie uma nova categoria para organizar seus produtos' }}
            </p>
          </div>
          <button @click="closeModal" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="submitCategory" class="modal-form">
          <div class="form-group">
            <label for="categoryName">
              Nome da Categoria *
            </label>
            <input
              id="categoryName"
              v-model="categoryForm.name"
              type="text"
              placeholder="Ex: Hambúrgueres Artesanais"
              required
              maxlength="50"
              :disabled="submitting"
            />
            <span class="char-count">{{ categoryForm.name.length }}/50</span>
          </div>
          
          <div class="form-group">
            <label for="categoryDescription">
              Descrição (Opcional)
            </label>
            <textarea
              id="categoryDescription"
              v-model="categoryForm.description"
              placeholder="Ex: Os melhores hambúrgueres artesanais da cidade"
              rows="3"
              maxlength="200"
              :disabled="submitting"
            ></textarea>
            <span class="char-count">{{ categoryForm.description.length }}/200</span>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="categoryForm.isVisible"
                :disabled="submitting"
              />
              <span class="checkbox-text">
                <span class="checkbox-title">Exibir no menu</span>
                <span class="checkbox-description">Esta categoria será visível para os clientes no cardápio</span>
              </span>
            </label>
          </div>
          
          <div class="form-group" style="display:none;">
            <label for="categoryOrder">Ordem de Exibição</label>
            <input
              id="categoryOrder"
              v-model.number="categoryForm.order"
              type="number"
              min="0"
              placeholder="0"
              :disabled="submitting"
            />
            <small>Números menores aparecem primeiro no menu (use o arrastar para reordenar)</small>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary" :disabled="submitting">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting" class="loading-spinner-inline"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              <span v-if="submitting">Salvando...</span>
              <span v-else>{{ showEditModal ? 'Atualizar' : 'Criar' }} Categoria</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="delete-modal" @click.stop>
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </div>
          <div class="header-content">
            <h2>Excluir Categoria</h2>
            <p class="header-subtitle">{{ categoryToDelete?.name }}</p>
          </div>
        </div>
        
        <!-- Conteúdo -->
        <div class="modal-content">
          <!-- Quando não há produtos -->
          <div v-if="categoryToDelete?.itemCount === 0" class="simple-delete">
            <div class="info-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <div>
                <h3>Esta categoria está vazia</h3>
                <p>Você pode excluí-la com segurança. Esta ação não pode ser desfeita.</p>
              </div>
            </div>
          </div>
          
          <!-- Quando há produtos -->
          <div v-else class="complex-delete">
            <!-- Aviso -->
            <div class="warning-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <div>
                <h3>Atenção!</h3>
                <p>Esta categoria possui <strong>{{ categoryToDelete?.itemCount }} produto(s)</strong> associado(s).</p>
                <p>Escolha como deseja proceder:</p>
              </div>
            </div>
            
            <!-- Opções de exclusão -->
            <div class="delete-options">
              <div class="option-item" :class="{ 'selected': deleteOption === 'category-only' }" @click="deleteOption = 'category-only'">
                <div class="option-radio">
                  <input type="radio" v-model="deleteOption" value="category-only" />
                </div>
                <div class="option-content">
                  <h4>Excluir apenas a categoria</h4>
                  <p>Os produtos ficarão sem categoria e precisarão ser reorganizados manualmente.</p>
                  <span class="option-badge warning">Não recomendado</span>
                </div>
              </div>
              
              <div class="option-item" :class="{ 'selected': deleteOption === 'category-and-products' }" @click="deleteOption = 'category-and-products'">
                <div class="option-radio">
                  <input type="radio" v-model="deleteOption" value="category-and-products" />
                </div>
                <div class="option-content">
                  <h4>Excluir categoria + produtos</h4>
                  <p>Remove completamente a categoria e todos os {{ categoryToDelete?.itemCount }} produto(s) associado(s).</p>
                  <span class="option-badge danger">Exclusão completa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botões -->
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancelar
          </button>
          <button @click="confirmDelete" class="btn-delete-confirm" :disabled="deleting || (categoryToDelete?.itemCount > 0 && !deleteOption)">
            <svg v-if="!deleting" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
            </svg>
            <svg v-else class="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <span v-if="deleting">Excluindo...</span>
            <span v-else-if="categoryToDelete?.itemCount === 0">Excluir Categoria</span>
            <span v-else-if="deleteOption === 'category-only'">Excluir Categoria</span>
            <span v-else-if="deleteOption === 'category-and-products'">Excluir Tudo</span>
            <span v-else>Selecione uma opção</span>
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Definir layout
definePageMeta({
  layout: 'dashboard'
})

// Estado da página
const loading = ref(true)
const categories = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const editingCategory = ref(null)
const categoryToDelete = ref(null)
const deleteOption = ref('')
const categoriesContainer = ref(null)
const isUpdatingOrder = ref(false)
let sortableInstance = null

// Formulário
const categoryForm = ref({
  name: '',
  description: '',
  order: 0,
  isVisible: true
})

// Alert
const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

// Carregar categorias
const { authenticatedFetch } = useAuthenticatedFetch()

const loadCategories = async () => {
  try {
    loading.value = true
    // Carregar categorias e contagem de produtos em paralelo
    const [categoriesResponse, countsResponse] = await Promise.all([
      authenticatedFetch('/api/categories?showAll=true'), // Mostrar todas as categorias no dashboard
      authenticatedFetch('/api/categories-count')
    ])
    
    categories.value = categoriesResponse.map(cat => ({
      ...cat,
      itemCount: countsResponse[cat._id] || 0
    }))
    
    // Inicializar SortableJS após carregar as categorias
    await nextTick()
    initSortableWhenReady()
  } catch (error) {
    showAlert('Erro ao carregar categorias', 'error')
  } finally {
    loading.value = false
  }
}

// Criar categoria
const createCategory = async () => {
  try {
    submitting.value = true
    const response = await authenticatedFetch('/api/categories', {
      method: 'POST',
      body: categoryForm.value
    })
    
    categories.value.unshift(response.category)
    showAlert('Categoria criada com sucesso!', 'success')
    closeModal()
    
    // Reinicializar SortableJS
    await nextTick()
    initSortableWhenReady()
  } catch (error) {
    showAlert(error.data?.message || 'Erro ao criar categoria', 'error')
  } finally {
    submitting.value = false
  }
}

// Editar categoria
const editCategory = (category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description || '',
    order: category.order || 0,
    isVisible: category.isVisible !== false // Default true se não definido
  }
  showEditModal.value = true
}

// Atualizar categoria
const updateCategory = async () => {
  try {
    submitting.value = true
    const response = await authenticatedFetch(`/api/categories/${editingCategory.value._id}`, {
      method: 'PUT',
      body: categoryForm.value
    })
    
    const index = categories.value.findIndex(c => c._id === editingCategory.value._id)
    if (index !== -1) {
      categories.value[index] = response.category
    }
    
    showAlert('Categoria atualizada com sucesso!', 'success')
    closeModal()
    
    // Reinicializar SortableJS
    await nextTick()
    initSortableWhenReady()
  } catch (error) {
    showAlert(error.data?.message || 'Erro ao atualizar categoria', 'error')
  } finally {
    submitting.value = false
  }
}

// Excluir categoria
const deleteCategory = (categoryId) => {
  const category = categories.value.find(c => c._id === categoryId)
  if (category) {
    categoryToDelete.value = category
    deleteOption.value = '' // Reset da opção
    showDeleteModal.value = true
  }
}

// Confirmar exclusão
const confirmDelete = async () => {
  if (!categoryToDelete.value) return
  
  try {
    deleting.value = true
    
    // Determinar a opção de exclusão
    const shouldDeleteProducts = categoryToDelete.value.itemCount > 0 && deleteOption.value === 'category-and-products'
    
    await authenticatedFetch(`/api/categories/${categoryToDelete.value._id}`, {
      method: 'DELETE',
      body: {
        deleteProducts: shouldDeleteProducts
      }
    })
    
    // Remover categoria da lista
    categories.value = categories.value.filter(c => c._id !== categoryToDelete.value._id)
    
    // Mostrar mensagem apropriada
    if (shouldDeleteProducts) {
      showAlert(`Categoria "${categoryToDelete.value.name}" e ${categoryToDelete.value.itemCount} produto(s) excluído(s) com sucesso!`, 'success')
    } else {
      showAlert('Categoria excluída com sucesso!', 'success')
    }
    
    showDeleteModal.value = false
    categoryToDelete.value = null
    deleteOption.value = ''
    
    // Reinicializar SortableJS
    await nextTick()
    initSortableWhenReady()
  } catch (error) {
    showAlert(error.data?.message || 'Erro ao excluir categoria', 'error')
  } finally {
    deleting.value = false
  }
}

// Submeter formulário
const submitCategory = () => {
  if (showEditModal.value) {
    updateCategory()
  } else {
    createCategory()
  }
}

// Fechar modal
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    description: '',
    order: 0,
    isVisible: true
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

// Initialize sortable when categories are loaded
const initSortableWhenReady = async () => {
  // Aguardar um pouco mais para garantir que o DOM esteja pronto
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (categories.value.length > 0 && categoriesContainer.value) {
    // Verificar se os elementos estão realmente no DOM
    const cards = categoriesContainer.value.querySelectorAll('.category-card')
    const handles = categoriesContainer.value.querySelectorAll('.drag-handle')
    
    console.log('Tentando inicializar Sortable:', {
      categories: categories.value.length,
      cards: cards.length,
      handles: handles.length,
      container: !!categoriesContainer.value
    })
    
    if (cards.length > 0 && handles.length > 0) {
      initSortable()
    } else {
      console.warn('Elementos não encontrados no DOM, tentando novamente...')
      // Tentar novamente após mais tempo
      setTimeout(() => {
        initSortableWhenReady()
      }, 200)
    }
  }
}

// Initialize sortable
const initSortable = async () => {
  // Destruir instância anterior se existir
  if (sortableInstance) {
    destroySortable()
  }
  
  if (!categoriesContainer.value) {
    console.warn('Container de categorias não encontrado')
    return
  }
  
  // Verificar se há elementos para ordenar
  const dragHandles = categoriesContainer.value.querySelectorAll('.drag-handle')
  const cards = categoriesContainer.value.querySelectorAll('.category-card')
  
  if (dragHandles.length === 0 || cards.length === 0) {
    console.warn('Elementos não encontrados:', { handles: dragHandles.length, cards: cards.length })
    return
  }
  
  try {
    // Importar SortableJS como dependência estática
    const { default: Sortable } = await import('sortablejs')
    
    console.log('SortableJS importado:', Sortable)
    
    sortableInstance = new Sortable(categoriesContainer.value, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: '.drag-handle',
      forceFallback: true,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      draggable: '.category-card',
      touchStartThreshold: 5,
      emptyInsertThreshold: 5,
      delay: 0,
      delayOnTouchStart: false,
      onStart: (evt) => {
        console.log('🎯 Drag started:', evt.oldIndex)
        evt.item.style.opacity = '0.6'
        evt.item.style.transform = 'rotate(2deg)'
        document.body.style.cursor = 'grabbing'
      },
      onEnd: async (evt) => {
        evt.item.style.opacity = '1'
        evt.item.style.transform = ''
        document.body.style.cursor = ''
        const { oldIndex, newIndex } = evt
        console.log('✅ Drag ended:', { oldIndex, newIndex })
        
        if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
          await updateCategoryOrder(oldIndex, newIndex)
        }
      },
      onError: (evt) => {
        console.error('❌ Sortable error:', evt)
        document.body.style.cursor = ''
        showAlert('Erro durante a ordenação', 'error')
      }
    })
    
    console.log('✅ Sortable inicializado com sucesso!', {
      container: categoriesContainer.value,
      handles: dragHandles.length,
      cards: cards.length,
      instance: sortableInstance
    })
  } catch (error) {
    console.error('❌ Erro ao inicializar Sortable:', error)
    showAlert('Erro ao inicializar ordenação: ' + error.message, 'error')
  }
}

// Destroy sortable
const destroySortable = () => {
  if (sortableInstance) {
    try {
      sortableInstance.destroy()
      console.log('Sortable destruído com sucesso')
    } catch (error) {
      console.error('Erro ao destruir Sortable:', error)
    } finally {
      sortableInstance = null
    }
  }
}

// Update category order
const updateCategoryOrder = async (oldIndex, newIndex) => {
  // Salvar estado original para rollback em caso de erro
  const originalCategories = [...categories.value]
  
  try {
    isUpdatingOrder.value = true
    
    // Reorder the array
    const movedCategory = categories.value.splice(oldIndex, 1)[0]
    categories.value.splice(newIndex, 0, movedCategory)
    
    // Update order values
    const updates = categories.value.map((category, index) => ({
      id: category._id,
      order: index
    }))
    
    console.log('Atualizando ordens:', updates)
    
    // Send batch update to server
    const updatePromises = updates.map(update => 
      authenticatedFetch(`/api/categories/${update.id}`, {
        method: 'PUT',
        body: { order: update.order }
      }).catch(error => {
        console.error(`Erro ao atualizar categoria ${update.id}:`, error)
        throw error
      })
    )
    
    await Promise.all(updatePromises)
    
    showAlert('Ordem das categorias atualizada!', 'success')
  } catch (error) {
    console.error('Erro ao atualizar ordem das categorias:', error)
    
    // Restaurar estado original
    categories.value = originalCategories
    
    // Mostrar erro específico
    const errorMessage = error.data?.message || error.message || 'Erro ao atualizar ordem das categorias'
    showAlert(errorMessage, 'error')
  } finally {
    isUpdatingOrder.value = false
  }
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
  window.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  destroySortable()
  window.removeEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.categories-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
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

/* Category Cards Improvements */
.category-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.item-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.category-description {
  color: #6b7280;
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
}

.category-description.no-description {
  color: #9ca3af;
  font-style: italic;
}

.created-date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.created-date svg {
  color: #9ca3af;
}


.btn-text {
  display: inline;
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

.loading-spinner-inline {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.sort-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
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
  justify-content: center;
  gap: 0.5rem;
  background: #ff8e24;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 44px; /* Touch-friendly */
  white-space: nowrap;
}

.btn-primary:hover {
  background: #e67e22;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}


.loading-spinner {
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

.loading {
  padding: 2rem 0;
}

.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-title {
  height: 1.25rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.25rem;
  width: 70%;
}

.skeleton-text {
  height: 1rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.25rem;
  width: 100%;
}

.skeleton-date {
  height: 0.875rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.25rem;
  width: 50%;
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

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
  position: relative;
}

.category-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.category-card.sortable {
  cursor: move;
}

.category-card.sortable:hover {
  border-color: #ff8e24;
  box-shadow: 0 4px 6px -1px rgba(255, 142, 36, 0.1);
}

.drag-handle {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  color: #9ca3af;
  cursor: grab;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  z-index: 10;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e7eb;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover {
  color: #ff8e24;
  background: #fff4ec;
  border-color: #ff8e24;
  transform: scale(1.1);
}

.drag-handle:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.drag-handle svg {
  pointer-events: none;
}

/* Sortable states */
.sortable-ghost {
  opacity: 0.4;
  background: #f3f4f6;
}

.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.2);
}

.sortable-drag {
  transform: rotate(5deg);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.3);
}

.category-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.category-info p {
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.created-date {
  font-size: 0.875rem;
  color: #9ca3af;
}

.category-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
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
  color: #ff8e24;
  border-color: #ff8e24;
}

.btn-edit:hover {
  background: #ff8e24;
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

.btn-delete.disabled {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #d1d5db;
  cursor: not-allowed;
}

.btn-delete.disabled:hover {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #d1d5db;
}

/* Modal de exclusão equilibrado */
.delete-modal {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 480px;
  width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #fef2f2;
  border-radius: 0.5rem;
  color: #dc2626;
}

.header-content h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

/* Conteúdo com scroll */
.modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  min-height: 0;
}

/* Scrollbar customizada */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Mensagens informativas */
.info-message,
.warning-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.info-message {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0c4a6e;
}

.warning-message {
  background: #fef3cd;
  border: 1px solid #fde68a;
  color: #92400e;
}

.info-message svg,
.warning-message svg {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-message h3,
.warning-message h3 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.info-message p,
.warning-message p {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

/* Opções de exclusão */
.delete-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: white;
}

.option-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.option-item.selected {
  border-color: #dc2626;
  background: #fef2f2;
}

.option-radio {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.option-radio input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: #dc2626;
  cursor: pointer;
}

.option-content {
  flex: 1;
}

.option-content h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.option-content p {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.option-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.option-badge.warning {
  background: #fef3cd;
  color: #92400e;
}

.option-badge.danger {
  background: #fef2f2;
  color: #dc2626;
}

/* Botões com tamanho fixo */
.modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  flex-shrink: 0;
}

.btn-cancel,
.btn-delete-confirm {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  flex: 1;
  justify-content: center;
  min-width: 0; /* Evita que os botões mudem de tamanho */
  white-space: nowrap; /* Evita quebra de linha */
}

/* Garantir que os ícones mantenham tamanho fixo */
.btn-cancel svg,
.btn-delete-confirm svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0; /* Evita que o ícone encolha */
}

.btn-cancel {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #f9fafb;
  color: #374151;
  border-color: #9ca3af;
}

.btn-delete-confirm {
  background: #dc2626;
  color: white;
  border: 1px solid #dc2626;
  font-weight: 600;
}

.btn-delete-confirm:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}

.btn-delete-confirm:disabled {
  background: #9ca3af;
  border-color: #9ca3af;
  cursor: not-allowed;
}

.loading-spinner {
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

/* Responsividade */
@media (max-width: 640px) {
  .delete-modal {
    width: 95vw;
    max-height: 85vh;
  }
  
  .modal-header {
    padding: 1rem 1rem 0.75rem;
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .modal-actions {
    padding: 0.75rem 1rem;
    flex-direction: column;
  }
  
  .btn-cancel,
  .btn-delete-confirm {
    width: 100%;
  }
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
  max-width: 500px;
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

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled {
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
  .categories-page {
    padding: 1.5rem;
  }
  
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .categories-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-left h1 {
    font-size: 1.5rem;
  }
  
  .page-description {
    font-size: 0.875rem;
  }
  
  .info-banner {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
  }
  
  .category-name-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .item-badge {
    font-size: 0.6875rem;
  }
  
  .category-description {
    font-size: 0.875rem;
  }
  
  .btn-text {
    display: none;
  }
  
  .modal-subtitle {
    font-size: 0.875rem;
  }
  
  .label-help {
    width: 14px;
    height: 14px;
    font-size: 0.6875rem;
  }
  
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .category-card {
    margin-bottom: 0;
  }
  
  .category-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-edit, .btn-delete {
    justify-content: center;
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
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

@media (max-width: 640px) {
  .categories-page {
    padding: 0.75rem;
  }
  
  .page-header h1 {
    font-size: 1.25rem;
  }
  
  .btn-primary {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    min-height: 44px;
    justify-content: center;
  }
  
  .category-info {
    padding-right: 2rem;
  }
  
  .category-info h3 {
    font-size: 1.125rem;
  }
  
  .drag-handle {
    top: 0.5rem;
    right: 0.5rem;
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
  .categories-page {
    padding: 0.5rem;
  }
  
  .page-header {
    padding: 0.75rem 0;
  }
  
  .page-header h1 {
    font-size: 1.125rem;
  }
  
  .category-card {
    border-radius: 0.5rem;
    padding: 1rem;
  }
  
  .category-info h3 {
    font-size: 1rem;
  }
  
  .category-info p {
    font-size: 0.875rem;
  }
  
  .created-date {
    font-size: 0.75rem;
  }
  
  .drag-handle {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem;
  }
  
  .drag-handle svg {
    width: 14px;
    height: 14px;
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
  .form-group textarea {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
  
  .btn-primary, .btn-secondary {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    min-height: 44px;
    justify-content: center;
  }
}

/* Checkbox styles */
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #ff8e24;
  flex-shrink: 0;
  margin-top: 2px;
}

.checkbox-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.checkbox-title {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.checkbox-description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

/* Category badges */
.category-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.visibility-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.visibility-badge.visible {
  background: #d1fae5;
  color: #065f46;
}

.visibility-badge.hidden {
  background: #fee2e2;
  color: #991b1b;
}
</style>
