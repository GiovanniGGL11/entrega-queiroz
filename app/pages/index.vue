<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import ImageOverlay from '~/components/ImageOverlay.vue'
import { useImageOverlay } from '~/composables/useImageOverlay'

// Estado do carrinho e modal
const selectedItem = ref(null);
const quantity = ref(1);
const complementsQty = ref({});
const observation = ref("");
const cart = ref([]);

// Estado da sidebar
const showSidebar = ref(false);

// Estado da navegação
const selectedCategory = ref("artesanal");
const searchQuery = ref("");

// Estado do cupom
const couponCode = ref("");
const discountAmount = ref(0);

// Estado do endereço de entrega
const deliveryAddress = ref("");
const deliveryComplement = ref("");
const deliveryFee = ref(0);
const deliveryDistance = ref(0);
const calculatingDelivery = ref(false);
const deliveryError = ref("");

// Estado mobile
const isMobile = ref(false);

// Estado do overlay de imagem
const { showImageOverlay, currentImageUrl, openImageOverlay, closeImageOverlay } = useImageOverlay()

// Dados das categorias
const categories = ref([])
const loadingCategories = ref(false)

// Configurações da loja
const storeSettings = ref({
  storeName: "",
  logo: "",
  banner: "",
  isOpen: false,
  deliveryMinTime: 0,
  deliveryMaxTime: 0,
  deliveryFee: 0,
  minimumOrder: 0
})

// Estado de carregamento inicial
const initialLoading = ref(true)
const settingsLoaded = ref(false)
const categoriesLoaded = ref(false)

// Carregar configurações da loja
const loadStoreSettings = async () => {
  try {
    const settings = await $fetch('/api/settings')
    storeSettings.value = {
      storeName: settings.storeName || "",
      logo: settings.logo || "",
      banner: settings.banner || "",
      isOpen: settings.isOpen || false,
      deliveryMinTime: settings.deliveryMinTime || 0,
      deliveryMaxTime: settings.deliveryMaxTime || 0,
      deliveryFee: settings.deliveryFee !== undefined ? settings.deliveryFee : 0,
      minimumOrder: settings.minimumOrder !== undefined ? settings.minimumOrder : 0
    }
    settingsLoaded.value = true
  } catch (error) {
    console.error('Erro ao carregar configurações da loja:', error)
    settingsLoaded.value = true
  }
}

// Carregar categorias com produtos da API (otimizado)
const loadCategories = async () => {
  try {
    loadingCategories.value = true
    
    // Usar a API que já retorna categorias com produtos
    const apiCategories = await $fetch('/api/categories-with-products')
    
    // Mapear categorias da API para o formato esperado
    categories.value = apiCategories.map(cat => ({
      id: cat._id,
      name: cat.name,
      items: cat.items || [] // Já vem com os produtos
    }))
    
    // Selecionar a primeira categoria se houver
    if (categories.value.length > 0) {
      selectedCategory.value = categories.value[0].id
    }
    
    categoriesLoaded.value = true
  } catch (error) {
    console.error('Erro ao carregar categorias:', error)
    categories.value = []
    categoriesLoaded.value = true
  } finally {
    loadingCategories.value = false
  }
}


// Computeds
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories.value;

  const query = searchQuery.value.toLowerCase().trim();
  return categories.value
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      ),
    }))
    .filter((cat) => cat.items.length > 0);
});

const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.totalPrice, 0);
});

const cartTotal = computed(() => {
  return cartSubtotal.value - discountAmount.value + deliveryFee.value;
});

const totalPrice = computed(() => {
  if (!selectedItem.value) return 0;

  let total = selectedItem.value.price * quantity.value;

  Object.entries(complementsQty.value).forEach(([name, qty]) => {
    const comp = selectedItem.value.complements.find((c) => c.name === name);
    if (comp && qty > 0) {
      total += comp.price * qty * quantity.value;
    }
  });

  return total;
});

// Formatação
const formatPrice = (value) => `R$ ${value.toFixed(2).replace(".", ",")}`;

// Intersection Observer
let observer = null;

const setupIntersectionObserver = () => {
  if (observer) observer.disconnect();

  const options = {
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    rootMargin: "-100px 0px -60% 0px", // Ajustado para melhor detecção com barra fixa
  };

  observer = new IntersectionObserver((entries) => {
    // Filtrar apenas entradas visíveis
    const visibleEntries = entries.filter(entry => entry.intersectionRatio > 0);
    
    if (visibleEntries.length === 0) return;
    
    // Encontrar a entrada com maior intersectionRatio
    const mostVisible = visibleEntries.reduce(
      (max, entry) =>
        entry.intersectionRatio > max.intersectionRatio ? entry : max,
      visibleEntries[0]
    );

    if (mostVisible?.intersectionRatio > 0.1) {
      const categoryId = mostVisible.target.id.replace("category-", "");
      selectedCategory.value = categoryId;
    }
  }, options);

  // Observar todas as seções de categoria
  nextTick(() => {
    filteredCategories.value.forEach((cat) => {
      const element = document.getElementById(`category-${cat.id}`);
      if (element) {
        observer.observe(element);
      }
    });
  });
};

// Navegação
const scrollToCategory = (categoryId) => {
  selectedCategory.value = categoryId;
  const element = document.getElementById(`category-${categoryId}`);

  if (element) {
    const offset = 80; // Ajustado para compensar a barra de categorias fixa
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
};

// Modal
const selectItem = (item) => {
  selectedItem.value = item;
  quantity.value = 1;
  observation.value = "";
  complementsQty.value = Object.fromEntries(
    item.complements.map((comp) => [comp.name, 0])
  );
};

const closeModal = () => {
  selectedItem.value = null;
  complementsQty.value = {};
  observation.value = "";
};

// Controles de quantidade
const updateQuantity = (delta) => {
  quantity.value = Math.max(1, quantity.value + delta);
};

const updateComplement = (name, delta) => {
  complementsQty.value[name] = Math.max(
    0,
    (complementsQty.value[name] || 0) + delta
  );
};

// Carrinho
const addToCart = () => {
  if (!selectedItem.value) return;

  const complements = Object.entries(complementsQty.value)
    .filter(([_, qty]) => qty > 0)
    .map(([name, qty]) => {
      const comp = selectedItem.value.complements.find((c) => c.name === name);
      return { name, qty, price: comp?.price || 0 };
    });

  const compStr = complements
    .map((c) => `${c.name}:${c.qty}`)
    .sort()
    .join(",");
  const variantKey = `${selectedItem.value.id}|${observation.value}|${compStr}`;

  const cartItem = {
    ...selectedItem.value,
    variantKey,
    quantity: quantity.value,
    complements,
    observation: observation.value,
    totalPrice: totalPrice.value,
  };

  const existingIndex = cart.value.findIndex(
    (item) => item.variantKey === variantKey
  );

  if (existingIndex >= 0) {
    cart.value[existingIndex].quantity += quantity.value;
    cart.value[existingIndex].totalPrice += totalPrice.value;
  } else {
    cart.value.push(cartItem);
  }

  console.log("Carrinho atualizado:", cart.value);
  closeModal();
};

const updateCartQuantity = (variantKey, delta) => {
  const index = cart.value.findIndex((i) => i.variantKey === variantKey);
  if (index === -1) return;

  const item = cart.value[index];
  const oldQuantity = item.quantity;
  const newQuantity = Math.max(1, oldQuantity + delta);
  if (newQuantity === oldQuantity) return;

  const unitPrice = item.totalPrice / oldQuantity;
  item.quantity = newQuantity;
  item.totalPrice = unitPrice * newQuantity;
};

const removeFromCart = (variantKey) => {
  const index = cart.value.findIndex((i) => i.variantKey === variantKey);
  if (index !== -1) {
    cart.value.splice(index, 1);
  }
};

const openSidebar = () => {
  showSidebar.value = true;
};

const closeSidebar = () => {
  showSidebar.value = false;
};

const finalizeOrder = () => {
  console.log("Finalizar pedido:", cart.value);
  // Aqui você pode implementar a lógica para finalizar o pedido
  closeSidebar();
};

const applyCoupon = () => {
  const subtotal = cartSubtotal.value;
  if (couponCode.value.toUpperCase() === "DESCONTO10") {
    discountAmount.value = subtotal * 0.1;
  } else {
    alert("Cupom inválido");
    discountAmount.value = 0;
  }
  couponCode.value = "";
};

// Calcular frete baseado no endereço
const calculateDelivery = async () => {
  if (!deliveryAddress.value || deliveryAddress.value.trim() === '') {
    deliveryFee.value = 0
    deliveryDistance.value = 0
    deliveryError.value = ""
    return
  }
  
  calculatingDelivery.value = true
  deliveryError.value = ""
  
  try {
    // Limpar e padronizar o endereço
    let searchAddress = deliveryAddress.value.trim()
    
    // Remover palavras comuns de complemento que podem atrapalhar a busca
    const complementWords = [
      /casa\s+\d+/gi,
      /apt[o]?\s*\.?\s*\d+/gi,
      /apartamento\s+\d+/gi,
      /bloco\s+[a-z0-9]+/gi,
      /bl\s*\.?\s*[a-z0-9]+/gi,
      /quadra\s+\d+/gi,
      /lote\s+\d+/gi,
      /sala\s+\d+/gi,
      /andar\s+\d+/gi
    ]
    
    // Criar versão sem complementos
    let cleanAddress = searchAddress
    complementWords.forEach(pattern => {
      cleanAddress = cleanAddress.replace(pattern, '')
    })
    cleanAddress = cleanAddress.replace(/\s+/g, ' ').trim()
    
    // Tentar múltiplas variações do endereço
    const addressVariations = [
      searchAddress, // Original
      cleanAddress, // Sem complementos
      `${cleanAddress}, Brasil`, // Com país
    ]
    
    let geocodeData = null
    let foundAddress = null
    
    // Tentar cada variação até encontrar resultado
    for (const addressToTry of addressVariations) {
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToTry)}&limit=3&countrycodes=br`
      )
      
      const data = await geocodeResponse.json()
      
      if (data && data.length > 0) {
        geocodeData = data[0]
        foundAddress = addressToTry
        break
      }
      
      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    if (!geocodeData) {
      deliveryError.value = "Endereço não encontrado. Tente incluir: Cidade - Estado (Ex: Rua, Número - São Paulo - SP)"
      deliveryFee.value = 0
      deliveryDistance.value = 0
      return
    }
    
    const clientLat = parseFloat(geocodeData.lat)
    const clientLng = parseFloat(geocodeData.lon)
    
    // Calcular taxa de entrega
    const response = await $fetch('/api/calculate-delivery', {
      method: 'POST',
      body: {
        latitude: clientLat,
        longitude: clientLng
      }
    })
    
    if (response.canDeliver) {
      deliveryFee.value = response.deliveryFee
      deliveryDistance.value = response.distance
      deliveryError.value = ""
    } else {
      deliveryError.value = response.message
      deliveryFee.value = 0
      deliveryDistance.value = response.distance
    }
  } catch (error) {
    console.error('Erro ao calcular entrega:', error)
    deliveryError.value = "Erro ao calcular entrega. Tente novamente."
    deliveryFee.value = 0
    deliveryDistance.value = 0
  } finally {
    calculatingDelivery.value = false
  }
}

// Debounce para calcular entrega
let deliveryTimeout = null
const onDeliveryAddressChange = () => {
  if (deliveryTimeout) {
    clearTimeout(deliveryTimeout)
  }
  deliveryTimeout = setTimeout(() => {
    calculateDelivery()
  }, 1000) // Aguarda 1 segundo após parar de digitar
}

// Keyboard shortcut handler
const handleKeydown = (event) => {
  if (event.key === "Escape") {
    if (showImageOverlay.value) {
      closeImageOverlay();
    } else if (selectedItem.value) {
      closeModal();
    } else if (showSidebar.value) {
      closeSidebar();
    }
  }
};

// Mobile check
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// LocalStorage
const CART_KEY = "queiroz-hamburgueria-cart";

const loadCart = () => {
  const saved = localStorage.getItem(CART_KEY);
  if (saved) {
    try {
      cart.value = JSON.parse(saved);
    } catch (e) {
      console.error("Invalid cart data from localStorage");
      cart.value = [];
    }
  }
};

const saveCart = () => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart.value));
};

// Watchers
watch(searchQuery, () => {
  if (observer) setupIntersectionObserver();
});

watch(selectedCategory, (newCategoryId) => {
  // Rolar a barra de categorias horizontalmente para mostrar a categoria ativa
  nextTick(() => {
    const categoryTabs = document.querySelector('.category-tabs');
    const activeTab = document.querySelector('.category-tabs .tab.active');
    
    if (categoryTabs && activeTab) {
      const tabsRect = categoryTabs.getBoundingClientRect();
      const activeRect = activeTab.getBoundingClientRect();
      
      // Calcular a posição de scroll para centralizar o tab ativo
      const scrollLeft = activeTab.offsetLeft - (categoryTabs.offsetWidth / 2) + (activeTab.offsetWidth / 2);
      
      categoryTabs.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  });
});

watch(selectedItem, (newVal) => {
  document.body.style.overflow = newVal ? "hidden" : "";
});

watch(showSidebar, (newVal) => {
  document.body.style.overflow = newVal ? "hidden" : "";
});

watch(showImageOverlay, (newVal) => {
  // Ajusta o overflow apenas se o modal não estiver aberto
  if (!selectedItem.value) {
    document.body.style.overflow = newVal ? "hidden" : "";
  }
});

watch(
  cart,
  () => {
    saveCart();
  },
  { deep: true }
);

watch(cartSubtotal, () => {
  if (discountAmount.value > cartSubtotal.value) {
    discountAmount.value = 0;
  }
});

// Lifecycle
onMounted(async () => {
  loadCart();
  
  // Carregar APIs em paralelo
  await Promise.all([
    loadStoreSettings(),
    loadCategories()
  ]);
  
  // Só mostra o conteúdo depois que tudo carregou
  initialLoading.value = false;
  
  setupIntersectionObserver();
  checkMobile();
  window.addEventListener("resize", checkMobile);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  if (observer) observer.disconnect();
  window.removeEventListener("resize", checkMobile);
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleKeydown);
});

useHead({
  title: () => `Queiroz Hamburgueria`,
});
</script>

<template>
  <!-- Loading Screen -->
  <div v-if="initialLoading" class="page-wrapper">
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Carregando cardápio...</p>
      </div>
    </div>
  </div>

  <!-- Conteúdo Principal (só aparece após carregar) -->
  <div v-else class="page-wrapper">
  <div class="container">
    <!-- Hero Section -->
    <div class="hero">
      <img
        :src="storeSettings.banner"
        alt="Banner da loja"
        class="banner"
      />
      
      <div class="profile">
        <img :src="storeSettings.logo" :alt="`Logo da ${storeSettings.storeName}`" />
        <div class="profile-info">
            <div class="store-name-row">
              <h2>{{ storeSettings.storeName }}</h2>
              <span :class="['status', storeSettings.isOpen ? 'open' : 'closed']">
                {{ storeSettings.isOpen ? 'Aberto' : 'Fechado' }}
              </span>
            </div>
            
            <!-- Tempo de Entrega -->
          <div class="info-row">
            <svg
              class="info-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            <span class="info-text">
              <strong>Entrega:</strong> {{ storeSettings.deliveryMinTime }}-{{ storeSettings.deliveryMaxTime }} min
            </span>
          </div>
          
          <!-- Taxa de Entrega -->
          <div class="info-row">
            <svg
              class="info-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span class="info-text">
              <strong>Taxa:</strong>
              <template v-if="storeSettings.deliveryFee > 0">
                R$ {{ storeSettings.deliveryFee.toFixed(2) }}
              </template>
              <template v-else>
                Grátis
              </template>
            </span>
          </div>
          
          <!-- Pedido Mínimo (se houver) -->
          <div class="info-row" v-if="storeSettings.minimumOrder > 0">
            <svg
              class="info-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span class="info-text">
              <strong>Pedido mínimo:</strong> R$ {{ storeSettings.minimumOrder.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="search">
      <svg
        class="search-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        fill="currentColor"
        width="20"
        height="20"
      >
        <path
          d="M500.3 443.7l-119.7-119.7c27.22-40.41 40.65-90.9 33.46-144.7C401.8 87.79 326.8 13.32 235.2 1.723C99.01-15.51-15.51 99.01 1.724 235.2c11.6 91.64 86.08 166.7 177.6 178.9c53.8 7.189 104.3-6.236 144.7-33.46l119.7 119.7c15.62 15.62 40.95 15.62 56.57 0C515.9 484.7 515.9 459.3 500.3 443.7zM79.1 208c0-70.58 57.42-128 128-128s128 57.42 128 128c0 70.58-57.42 128-128 128S79.1 278.6 79.1 208z"
        />
      </svg>
      <input
        type="text"
        placeholder="Buscar no cardápio"
        v-model="searchQuery"
      />
    </div>

    <!-- Category Tabs -->
    <div class="category-tabs" v-if="!loadingCategories && filteredCategories.length">
      <button
        v-for="category in filteredCategories"
        :key="category.id"
        class="tab"
        :class="{ active: selectedCategory === category.id }"
        @click="scrollToCategory(category.id)"
      >
        {{ category.name }}
      </button>
    </div>
    
    

    <!-- Categories -->
    <div class="categories" v-if="filteredCategories.length">
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        :id="`category-${category.id}`"
        class="category"
      >
        <h3>{{ category.name }}</h3>
        <div class="items">
          <div
            v-for="item in category.items"
            :key="item.id"
            class="item"
            @click="selectItem(item)"
          >
            <div class="image-wrapper">
              <img :src="item.image" :alt="item.name" class="item-image" />
            </div>
            <div class="description">
              <h4>{{ item.name }}</h4>
              <p>{{ item.description }}</p>
              <span class="price">{{ formatPrice(item.price) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State - Nenhum resultado -->
    <div v-else-if="!loadingCategories && searchQuery" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>Nenhum produto encontrado</h3>
      <p>Não encontramos produtos com "{{ searchQuery }}"</p>
      <p class="empty-hint">Tente buscar por outro nome ou categoria</p>
    </div>
  </div>

  <!-- Floating Cart Button -->
  <button v-if="cart.length > 0" class="floating-cart-btn" @click="openSidebar">
    <div class="left-side">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M17 18c-1.11 0-2 .89-2 2a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 0-2-2M1 2v2h2l3.6 7.59l-1.36 2.45c-.15.28-.24.61-.24.96a2 2 0 0 0 2 2h12v-2H7.42a.25.25 0 0 1-.25-.25q0-.075.03-.12L8.1 13h7.45c.75 0 1.41-.42 1.75-1.03l3.58-6.47c.07-.16.12-.33.12-.5a1 1 0 0 0-1-1H5.21l-.94-2M7 18c-1.11 0-2 .89-2 2a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 0-2-2"
        />
      </svg>
      <span class="cart-price">{{ formatPrice(cartTotal) }}</span>
    </div>
    <span v-if="!isMobile" class="cart-text">VER CARRINHO</span>
  </button>

  <!-- Footer Melhorado -->
  <footer class="footer">
    <div class="footer-bottom">
      <p>
        &copy; {{ new Date().getFullYear() }} Queiroz Hamburgueria. Desenvolvido
        por
        <a
          href="https://www.instagram.com/g2genesys/"
          target="_blank"
          rel="noopener noreferrer"
          >G2 Genesys</a
        >.
      </p>
    </div>
  </footer>
  </div>

  <!-- Sidebar Overlay + Sidebar (teleportados para body) -->
  <Teleport to="body">
  <div v-if="showSidebar && !initialLoading" class="sidebar-overlay" @click="closeSidebar"></div>

  <!-- Sidebar -->
  <div v-if="showSidebar && !initialLoading" class="sidebar open">
    <div class="sidebar-header">
      <h3>Seu Carrinho</h3>
      <button class="close-sidebar-btn" @click="closeSidebar">×</button>
    </div>

    <div class="sidebar-body">
      <div v-for="item in cart" :key="item.variantKey" class="cart-item">
        <img :src="item.image" :alt="item.name" class="cart-item-image" />
        <div class="cart-item-info">
          <h4>{{ item.name }}</h4>
          <p v-if="item.observation" class="observation">
            {{ item.observation }}
          </p>
          <div
            v-if="item.complements && item.complements.length > 0"
            class="complements"
          >
            <span
              v-for="comp in item.complements"
              :key="comp.name"
              class="complement"
            >
              <b>{{ comp.qty }}x</b> {{ comp.name }}
            </span>
          </div>
        </div>
        <div class="cart-item-right">
          <button
            class="delete-btn"
            @click="removeFromCart(item.variantKey)"
            aria-label="Remover item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3,6 5,6 21,6"></polyline>
              <path
                d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"
              ></path>
            </svg>
          </button>
          <div class="quantity-controls">
            <button
              class="qty-btn"
              @click="updateCartQuantity(item.variantKey, -1)"
              :disabled="item.quantity <= 1"
            >
              −
            </button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button
              class="qty-btn"
              @click="updateCartQuantity(item.variantKey, 1)"
            >
              +
            </button>
          </div>
          <span class="item-total">{{ formatPrice(item.totalPrice) }}</span>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <!-- Campo de Endereço de Entrega -->
      <div class="delivery-address-section">
        <label for="deliveryAddress" class="delivery-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Endereço de Entrega
        </label>
        <div class="delivery-input-wrapper">
          <input
            id="deliveryAddress"
            type="text"
            v-model="deliveryAddress"
            @input="onDeliveryAddressChange"
            placeholder="Rua, Número - Bairro, Cidade - Estado"
            class="delivery-input"
          />
          <div v-if="calculatingDelivery" class="calculating-spinner">
            <div class="spinner-small"></div>
          </div>
        </div>
        <small v-if="!deliveryError && !calculatingDelivery" class="delivery-hint">
          Ex: Rua, Número - Bairro - São Paulo - SP
        </small>
        
        <!-- Campo de Complemento (opcional) -->
        <div class="complement-wrapper">
          <input
            type="text"
            v-model="deliveryComplement"
            placeholder="Complemento (opcional): Casa, Apto, Bloco..."
            class="complement-input"
          />
        </div>
        
        <div v-if="deliveryError" class="delivery-error">
          ⚠️ {{ deliveryError }}
        </div>
        <div v-if="deliveryDistance > 0 && !deliveryError" class="delivery-success">
          ✅ Distância: {{ deliveryDistance.toFixed(1) }}km
          <span v-if="deliveryComplement" class="complement-display">• {{ deliveryComplement }}</span>
        </div>
      </div>

      <!-- <div class="coupon-section">
        <input
          type="text"
          v-model="couponCode"
          placeholder="Cupom de desconto"
        />
        <button class="apply-coupon-btn" @click="applyCoupon">Aplicar</button>
      </div> -->
      
      <!-- Subtotal -->
      <div class="subtotal">
        <span class="subtotal-label">Subtotal</span>
        <span class="subtotal-value">{{ formatPrice(cartSubtotal) }}</span>
      </div>
      
      <!-- Desconto -->
      <div v-if="discountAmount > 0" class="discount">
        <span class="discount-label">Desconto</span>
        <span class="discount-value">-{{ formatPrice(discountAmount) }}</span>
      </div>
      
      <!-- Taxa de Entrega -->
      <div v-if="deliveryAddress" class="delivery-fee-line">
        <span class="delivery-label">Taxa de Entrega</span>
        <span class="delivery-value" :class="{ free: deliveryFee === 0 }">
          {{ deliveryFee === 0 ? 'Grátis' : formatPrice(deliveryFee) }}
        </span>
      </div>
      
      <div class="total">
        <span class="total-label">Total</span>
        <span class="total-value">{{ formatPrice(cartTotal) }}</span>
      </div>
      <button class="finalize-btn" @click="finalizeOrder" :disabled="!deliveryAddress || deliveryError || calculatingDelivery">
        {{ deliveryAddress && !deliveryError ? 'Finalizar Pedido' : 'Informe o endereço de entrega' }}
      </button>
    </div>
  </div>
  </Teleport>

  <!-- Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="selectedItem" class="modal-overlay" @click="closeModal">
        <div class="modal-card" @click.stop>
          <div class="scrollable-content">
            <div class="image-container">
              <img
                :src="selectedItem.image"
                :alt="selectedItem.name"
                class="modal-image"
                @click="openImageOverlay(selectedItem.image)"
              />
              <button class="close-btn" @click="closeModal" aria-label="Fechar">
                ×
              </button>
            </div>

            <div class="modal-body">
              <div class="modal-content">
                <h4>{{ selectedItem.name }}</h4>
                <p>{{ selectedItem.description }}</p>
              </div>

              <div class="complements-section">
                <h5>Complementos (Opcional)</h5>
                <div
                  v-for="comp in selectedItem.complements"
                  :key="comp.name"
                  class="complement-item"
                >
                  <span class="comp-name">{{ comp.name }}</span>
                  <div class="comp-controls">
                    <button
                      class="qty-btn"
                      @click="updateComplement(comp.name, -1)"
                      :disabled="!complementsQty[comp.name]"
                    >
                      −
                    </button>
                    <span class="qty-value">{{
                      complementsQty[comp.name] || 0
                    }}</span>
                    <button
                      class="qty-btn"
                      @click="updateComplement(comp.name, 1)"
                    >
                      +
                    </button>
                  </div>
                  <span class="comp-price">
                    {{
                      comp.price > 0 ? formatPrice(comp.price) : "(Cortesia)"
                    }}
                  </span>
                </div>
              </div>

              <div class="observation">
                <label for="obs">Observação</label>
                <textarea
                  id="obs"
                  v-model="observation"
                  placeholder="Ex: tirar cebola"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="price-quantity">
              <div class="modal-price">{{ formatPrice(totalPrice) }}</div>
              <div class="quantity-controls">
                <button class="qty-btn" @click="updateQuantity(-1)">−</button>
                <span class="qty-value">{{ quantity }}</span>
                <button class="qty-btn" @click="updateQuantity(1)">+</button>
              </div>
            </div>
            <button class="add-to-cart" @click="addToCart">Adicionar</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Image Overlay -->
  <ImageOverlay
    :show="showImageOverlay"
    :imageUrl="currentImageUrl"
    :alt="selectedItem?.name || 'Imagem do item'"
    @close="closeImageOverlay"
  />
</template>

<style scoped>
* {
  box-sizing: border-box;
}

/* Previne flash de conteúdo não estilizado */
[v-cloak] {
  display: none !important;
}

/* Page Wrapper */
.page-wrapper {
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  position: relative;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}


body {
  overflow-x: hidden; /* Previne scroll horizontal global */
}

.alert {
  background-color: #e67e22;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  /* position: fixed; */
  /* top: 0; */

  padding: 0.5rem;
  z-index: 999;
  color: #fff;
  font-weight: 600;
}

.alert p .code {
  font-weight: 900;
}

.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 4rem 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;
}

@media (max-width: 768px) {
  .container {
    padding: 2rem 1rem 0;
  }
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.banner {
  width: 100%;
  height: 328px;
  object-fit: cover;
  border-radius: 1rem;
}

@media (max-width: 768px) {
  .banner {
    height: 200px;
    border-radius: 0.5rem;
  }
}

.profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 480px) {
  .profile {
    flex-direction: column;
    align-items: flex-start;
  }
}

.profile img {
  width: 78px;
  height: 78px;
  object-fit: cover;
  border-radius: 50%;
}

@media (max-width: 480px) {
  .profile img {
    width: 64px;
    height: 64px;
  }
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.store-name-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.profile-info h2 {
  font-size: 2rem;
  font-weight: 500;
  color: #323232;
  margin: 0;
}

@media (max-width: 768px) {
  .profile-info h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .profile-info h2 {
    font-size: 1.25rem;
  }
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-icon {
  color: #FF6B35;
  flex-shrink: 0;
}

.info-text {
  color: #666;
  font-size: 0.875rem;
  line-height: 1.4;
}

.info-text strong {
  color: #323232;
  font-weight: 600;
}

.status.open {
  background-color: rgba(0, 255, 0, 0.2);
  color: #009a00;
  padding: 0.3rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status.closed {
  background-color: rgba(255, 0, 0, 0.2);
  color: #d00;
  padding: 0.3rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.search {
  display: flex;
  align-items: center;
  border: 1px solid #efefef;
  border-radius: 0.5rem;
  padding: 0 1.5rem;
}

.search-icon {
  color: #ff8e24;
  flex-shrink: 0;
}

.search input {
  flex: 1;
  padding: 1rem;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
}

.category-tabs {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  background: #f8fafc;
  scrollbar-width: none;
  margin-bottom: 0.5rem;
  transition: box-shadow 0.3s ease;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.loading-categories {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tab {
  flex-shrink: 0;
  padding: 0.75rem 1.5rem;
  border: 1px solid #efefef;
  border-radius: 0.5rem;
  background: #fff;
  color: #323232;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab:hover {
  background: #f9f9f9;
}

.tab.active {
  background: #ff8e24;
  color: #fff;
  border-color: #ff8e24;
}

.categories {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  overflow-x: hidden;
}

.category h3 {
  color: #323232;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s;
  height: 100%; /* Garante altura uniforme nos cards */
}

.item:hover {
  transform: translateY(-2px);
}

.image-wrapper {
  position: relative;
  cursor: pointer;
}

.item-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 0.5rem;
  transition: transform 0.2s ease;
}

.item-image:hover {
  transform: scale(1.02);
}

.description {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1; /* Permite que a descrição cresça, mas limitada pelo clamp */
  overflow: hidden; /* Previne overflow no description */
}

.description h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #323232;
  margin: 0;
}

.description p {
  font-size: 0.875rem;
  color: #666;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Limita a 3 linhas com "..." */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: break-word; /* Quebra palavras longas */
  word-break: break-word; /* Força quebra de palavras longas */
  hyphens: auto; /* Adiciona hífens onde possível */
  max-width: 100%; /* Garante que não exceda a largura do container */
}

.price {
  font-weight: 600;
  color: #ff8e24;
  font-size: 1rem;
  margin-top: auto; /* Empurra o preço para o final do card */
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #FF6B35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-content p {
  font-size: 1.125rem;
  color: #666;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Skeleton removido da home */

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  margin: 2rem auto;
  max-width: 500px;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: bounce 2s ease-in-out infinite;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.empty-state p {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: #9ca3af;
  font-style: italic;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Footer Melhorado */
.footer {
  width: 100%;
  /* background: #f8f9fa; */
  padding: 2rem 0 1.5rem;
  color: #666;
  font-size: 0.875rem;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 0 2rem;
}

.footer-section h4 {
  color: #323232;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.footer-section p {
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.social-links a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff8e24;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.social-links a:hover {
  color: #e67e22;
}

.social-links svg {
  flex-shrink: 0;
}

.footer-bottom {
  border-top: 1px solid #efefef;
  padding-top: 1rem;
  text-align: center;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 2rem;
  padding-right: 2rem;
}

.footer-bottom a {
  color: #ff8e24;
  text-decoration: none;
  font-weight: 500;
}

.footer-bottom a:hover {
  text-decoration: underline;
}

/* Floating Cart Button */
.floating-cart-btn {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff8e24;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.3);
  z-index: 99;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 300px;
  transition: background 0.2s;
}

.floating-cart-btn:hover {
  background: #e67e22;
}

.left-side {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-price {
  font-weight: 600;
}

.cart-text {
  text-transform: uppercase;
  font-weight: 500;
}

/* Sidebar */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 350px;
  height: 100dvh;
  background: #fff;
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  visibility: hidden; /* escondida por padrão */
  flex-direction: column;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* Evita quebra da sidebar por conteúdo largo */
}

.sidebar.open {
  transform: translateX(0);
  visibility: visible; /* visível quando aberta */
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #efefef;
  flex-shrink: 0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #323232;
}

.close-sidebar-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-sidebar-btn:hover {
  color: #323232;
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  overflow-x: hidden; /* Evita quebra horizontal na sidebar */
  -webkit-overflow-scrolling: touch;
}

.cart-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #efefef;
}

.cart-item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.cart-item-info {
  flex: 1;
  min-width: 0; /* Permite que o flex item encolha e quebre texto */
  display: flex;
  flex-direction: column;
}

.cart-item-info h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #323232;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.observation {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Limita a 2 linhas com "..." na sidebar */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.complements {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.complement {
  background: #f9f9f9;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #666;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  max-width: 100%; /* Evita quebra dos spans de complementos */
}

.cart-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
  min-width: 0;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-bottom: auto;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #ff0000;
}

.item-total {
  font-weight: 600;
  color: #ff8e24;
  font-size: 1rem;
  white-space: nowrap;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #efefef;
  background: #f9f9f9;
  flex-shrink: 0;
}

.coupon-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.coupon-section input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #efefef;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
}

.coupon-section input:focus {
  border-color: #ff8e24;
}

.apply-coupon-btn {
  padding: 0.75rem 1rem;
  background: #ff8e24;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.apply-coupon-btn:hover {
  background: #e67e22;
}

.subtotal,
.discount,
.total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.125rem;
  color: #323232;
  margin-bottom: 0.5rem;
}

.subtotal-label,
.discount-label,
.total-label {
  font-weight: normal;
}

.subtotal-value,
.discount-value,
.total-value {
  font-weight: 600;
}

.discount {
  color: #28a745;
}

.discount-value {
  color: #28a745;
}

.total {
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.total-label {
  font-weight: 500;
}

.total-value {
  color: #ff8e24;
}

.finalize-btn {
  width: 100%;
  padding: 1rem;
  background: #ff8e24;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.finalize-btn:hover {
  background: #e67e22;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: #fff;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  /* border-radius: 1rem; */
  border-top-left-radius: 1rem;
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
  overflow: hidden;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* Evita quebra horizontal no modal */
}

.image-container {
  position: relative;
  cursor: zoom-in;
}

.modal-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}

.modal-image:hover {
  transform: scale(1.02);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #323232;
  background: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-body {
  padding: 1.5rem;
}

.modal-content h4 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #323232;
  margin: 0 0 0.5rem;
}

.modal-content p {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
  /* margin: 0 0 1rem; */
  /* display: -webkit-box; */
  -webkit-line-clamp: 4; /* Limita a 4 linhas com "..." no modal */
  /* -webkit-box-orient: vertical; */
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: break-word; /* Quebra palavras longas no modal */
  /* word-break: break-word; */
  /* hyphens: auto; */
}

.complements-section {
  border-top: 1px solid #efefef;
  padding-top: 1rem;
  margin-top: 1rem;
}

.complements-section h5 {
  font-size: 1.125rem;
  color: #323232;
  margin: 0 0 0.75rem;
}

.complement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}

.comp-name {
  flex: 1;
  font-weight: 500;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  min-width: 0;
}

.comp-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 1rem;
  flex-shrink: 0;
}

.comp-price {
  font-size: 0.875rem;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;
}

.observation {
  /* margin-top: 1rem; */
}

.observation label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #323232;
}

.observation textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db; /* Border mais escura para melhor visibilidade */
  border-radius: 0.5rem;
  resize: vertical;
  font-size: 1rem; /* Aumentado para melhor legibilidade */
  min-height: 100px; /* Aumentado para mais espaço visível */
  max-height: 150px;
  font-family: inherit;
  /* background-color: #fafafa; Fundo levemente cinza para destaque */
  color: #374151; /* Cor de texto mais escura */
  outline: none;
  overflow-y: auto; /* Adiciona scroll vertical se o texto ultrapassar a max-height */
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.observation textarea:focus {
  border-color: #ff8e24; /* Destaque no foco */
  background-color: #fff;
}

.observation textarea::placeholder {
  color: #9ca3af; /* Placeholder mais visível */
}

.modal-footer {
  padding: 1.5rem;
  background: #fff;
  border-top: 1px solid #efefef;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.price-quantity {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff8e24;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #efefef;
  background: #fff;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 600;
  color: #323232;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  background: #f9f9f9;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-value {
  font-size: 1.125rem;
  font-weight: 600;
  min-width: 32px;
  text-align: center;
}

.add-to-cart {
  width: 100%;
  padding: 1rem;
  background: #ff8e24;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.add-to-cart:hover {
  background: #e67e22;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: scale(0.9);
}

.image-overlay-enter-active,
.image-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.image-overlay-enter-from,
.image-overlay-leave-to {
  opacity: 0;
}

.image-overlay-enter-active .image-overlay-content,
.image-overlay-leave-active .image-overlay-content {
  transition: transform 0.3s ease;
}

.image-overlay-enter-from .image-overlay-content,
.image-overlay-leave-to .image-overlay-content {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 1200px) {
  .container {
    padding: 3rem 6rem 0;
  }

  .description p {
    -webkit-line-clamp: 2; /* Reduz para 2 linhas em telas menores */
  }

  .modal-content p {
    -webkit-line-clamp: 3;
  }

  .footer {
    padding: 1.5rem 0 1rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0 1rem;
  }

  .footer-bottom {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 2rem 1rem 0;
  }

  .banner {
    height: 200px;
  }

  .profile {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile img {
    width: 75px;
    height: 75px;
  }

  .items {
    grid-template-columns: 1fr;
  }

  .item {
    flex-direction: row;
    gap: 1rem;
  }

  .image-wrapper {
    flex-shrink: 0;
  }

  .item-image {
    width: 110px;
    height: 110px;
  }

  .description {
    flex: 1; /* Permite que a descrição ocupe o espaço restante no mobile */
    min-width: 0;
  }

  .description h4 {
    font-size: 1rem;
  }

  .description p {
    -webkit-line-clamp: 2;
    font-size: 0.8rem; /* Reduz fonte no mobile para melhor ajuste */
  }

  .search {
    padding: 0 1rem;
  }

  .search input {
    padding: 0.75rem;
    font-size: 0.875rem;
  }

  .tab {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .category h3 {
    font-size: 1.25rem;
  }

  .modal-card {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }

  .modal-image {
    height: 250px;
  }
  
  .close-btn {
    width: 44px;
    height: 44px;
    font-size: 1.75rem;
    top: 0.75rem;
    right: 0.75rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-content h4 {
    font-size: 1.25rem;
  }

  .modal-content p {
    -webkit-line-clamp: 3; /* Ajusta limite no mobile */
    font-size: 0.875rem;
  }

  .complement-item {
    padding: 0.5rem;
  }

  .comp-name {
    font-size: 0.875rem;
  }

  .comp-price {
    font-size: 0.8rem;
  }

  .observation {
    /* margin-top: 1rem; */
  }

  .observation textarea {
    /* padding: 0.5rem; */
    font-size: 0.875rem;
    /* min-height: 80px; */
    /* max-height: 120px; */
  }

  .modal-footer {
    padding: 1rem;
  }

  .qty-btn {
    width: 34px;
    height: 34px;
    font-size: 1rem;
  }

  .qty-value {
    font-size: 1rem;
  }

  .add-to-cart {
    padding: 0.75rem;
    font-size: 0.875rem;
  }

  .footer {
    padding: 1.5rem 0 1rem;
  }

  .footer-content {
    margin-bottom: 1rem;
    padding: 0 0.5rem;
    gap: 1.5rem;
  }

  .footer-section h4 {
    font-size: 1rem;
  }

  .footer-section p {
    font-size: 0.8rem;
  }

  .social-links a {
    font-size: 0.8rem;
  }

  .footer-bottom {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    font-size: 0.8rem;
  }

  .sidebar {
    width: 100%;
  }

  .sidebar-header {
    padding: 0.75rem;
  }

  .sidebar-header h3 {
    font-size: 1.125rem;
  }

  .sidebar-body {
    padding: 0.75rem;
  }

  .cart-item-image {
    width: 50px;
    height: 50px;
  }

  .cart-item {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .cart-item-info h4 {
    font-size: 0.9rem;
  }

  .observation {
    font-size: 0.75rem;
    /* -webkit-line-clamp: 1; */
  }

  .complement {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .item-total {
    font-size: 0.875rem;
  }

  .quantity-controls {
    gap: 0.3rem;
  }

  .qty-btn {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }

  .qty-value {
    font-size: 0.875rem;
    min-width: 24px;
  }

  .sidebar-footer {
    padding: 0.75rem;
  }

  .coupon-section {
    flex-direction: column;
    gap: 0.25rem;
  }

  .coupon-section input {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .apply-coupon-btn {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .total {
    font-size: 1.125rem;
  }

  .total-value {
    font-size: 1.125rem;
  }

  .finalize-btn {
    padding: 0.75rem;
    font-size: 0.875rem;
  }

  .floating-cart-btn {
    bottom: 10px;
    padding: 10px 16px;
    font-size: 0.875rem;
    gap: 6px;
    width: 90%;
  }

  .left-side {
    gap: 6px;
  }

  .cart-price {
    font-size: 0.875rem;
  }

  .image-close-btn {
    top: 0.75rem;
    right: 0.75rem;
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 1rem 0.5rem 0;
  }

  .banner {
    height: 160px;
  }

  .profile img {
    width: 65px;
    height: 65px;
  }

  .item-image {
    width: 90px;
    height: 90px;
  }

  .description p {
    /* -webkit-line-clamp: 1; Limita a 1 linha em telas muito pequenas */
    font-size: 0.75rem;
  }

  .close-btn {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
    top: 0.5rem;
    right: 0.5rem;
  }

  .modal-body {
    padding: 0.75rem;
  }

  .modal-footer {
    padding: 0.75rem;
  }

  .observation textarea {
    /* padding: 0.4rem; */
    font-size: 0.8rem;
    /* min-height: 60px; */
    /* max-height: 100px; */
  }

  .footer {
    padding: 1rem 0 0.75rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0;
    margin-bottom: 0.75rem;
  }

  .footer-section p {
    font-size: 0.75rem;
  }

  .social-links a {
    font-size: 0.75rem;
    gap: 0.25rem;
  }

  .social-links svg {
    width: 16px;
    height: 16px;
  }

  .footer-bottom {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    font-size: 0.75rem;
  }

  .floating-cart-btn {
    padding: 8px 12px;
    font-size: 0.75rem;
    gap: 4px;
    width: 95%;
  }

  .cart-item-image {
    width: 45px;
    height: 45px;
  }

  .cart-item {
    gap: 0.4rem;
  }

  .cart-item-info h4 {
    font-size: 0.85rem;
  }

  .observation {
    font-size: 0.7rem;
  }

  .complement {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }

  .qty-btn {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .qty-value {
    font-size: 0.8rem;
    min-width: 22px;
  }

  .coupon-section input {
    padding: 0.4rem;
    font-size: 0.75rem;
  }

  .apply-coupon-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
  }

  .total {
    font-size: 1rem;
  }

  .finalize-btn {
    padding: 0.6rem;
    font-size: 0.8rem;
  }

  .modal-content p {
    -webkit-line-clamp: 2;
    font-size: 0.8rem;
  }

  .image-overlay-content {
    max-width: 95%;
    max-height: 95%;
  }

  .image-close-btn {
    top: 0.5rem;
    right: 0.5rem;
    font-size: 1.5rem;
  }
}

/* Endereço de Entrega */
.delivery-address-section {
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  border: 2px solid #e5e7eb;
}

.delivery-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.delivery-input-wrapper {
  position: relative;
}

.delivery-input {
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.delivery-input:focus {
  outline: none;
  border-color: #FF6B35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.calculating-spinner {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #FF6B35;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.delivery-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.complement-wrapper {
  margin-top: 0.75rem;
}

.complement-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  transition: all 0.2s;
  background: #f9fafb;
}

.complement-input:focus {
  outline: none;
  border-color: #FF6B35;
  background: white;
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

.complement-display {
  margin-left: 0.5rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.delivery-error {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.delivery-success {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #d1fae5;
  color: #059669;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Linha de Taxa de Entrega */
.delivery-fee-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.delivery-fee-line .delivery-label {
  color: #4b5563;
  font-weight: 500;
  margin: 0;
}

.delivery-value {
  font-weight: 700;
  color: #1f2937;
}

.delivery-value.free {
  color: #10b981;
}

/* Subtotal */
.subtotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.subtotal-label {
  color: #4b5563;
  font-weight: 500;
}

.subtotal-value {
  font-weight: 600;
  color: #1f2937;
}

/* Botão Finalizar Desabilitado */
.finalize-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.finalize-btn:disabled:hover {
  background: #9ca3af;
  transform: none;
}
</style>