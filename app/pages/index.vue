<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import ImageOverlay from '~/components/ImageOverlay.vue'
import StoreInfoModal from '~/components/StoreInfoModal.vue'
import { useImageOverlay } from '~/composables/useImageOverlay'
import { useCart } from '~/composables/useCart'
import { usePrimaryColor } from '~/composables/usePrimaryColor'

// Estado do carrinho e modal
const selectedItem = ref(null);
const quantity = ref(1);
const complementsQty = ref({});
const observation = ref("");

// Usar o composable do carrinho
const { cart, cartCount, cartSubtotal, cartTotal, addToCart: addToCartComposable, removeFromCart, updateCartQuantity } = useCart()

// Carregar cor primária
const { loadPrimaryColor } = usePrimaryColor()

// Estado da sidebar
const showSidebar = ref(false);

// Estado da navegação
const selectedCategory = ref(null);
const searchQuery = ref("");

// Modal de confirmação de idade
const showAgeModal = ref(false)
const pendingAgeCallback = ref(null)

// Estado do cupom
const couponCode = ref("");
const discountAmount = ref(0);
const appliedCoupon = ref(null);
const applyingCoupon = ref(false);

// Estado mobile
const isMobile = ref(false);

// Estado do overlay de imagem
const { showImageOverlay, currentImageUrl, openImageOverlay, closeImageOverlay } = useImageOverlay()

// Estado do modal de informações da loja
const showStoreInfoModal = ref(false)

// Estado do menu hamburguer
const showHamburgerMenu = ref(false)

// Estado do modal de aviso
const alertModal = ref({
  show: false,
  title: '',
  message: '',
  type: 'warning' // 'warning', 'error', 'info'
})

// Estado da barra de categorias fixa
const showFixedCategoryBar = ref(false)

// Estado para controlar se está no topo da página
const isAtTop = ref(true)

// Estado do modal de conta
const showAccountModal = ref(false)

// Estado do modal de login/conta do cliente
const showLoginModal = ref(false)
const isCustomerIdentified = ref(false)
const customerData = ref(null)

// Abas do modal de conta
const accountTab = ref('login') // 'login' | 'register' | 'perfil' | 'address'
const accountForm = ref({ name: '', email: '', phone: '', password: '', address: '', number: '', neighborhood: '', city: '', zipCode: '' })
const accountError = ref('')
const accountLoading = ref(false)
const loginContext = ref('account') // 'account' | 'order'

// Perfil expandido
const perfilTab = ref('dados') // mantido apenas para compatibilidade interna
const perfilForm = ref({ name: '', phone: '', zipCode: '', address: '', number: '', neighborhood: '', city: '', currentPassword: '', newPassword: '', confirmPassword: '' })
const perfilSuccess = ref('')
const perfilError = ref('')
const perfilLoading = ref(false)
const showPasswordSection = ref(false)
const avatarUploading = ref(false)
const avatarPreview = ref('')

// Dados das categorias
const categories = ref([])
const loadingCategories = ref(false)

// Carrossel de banners
// Carrossel infinito seamless
// currentBanner aponta para o índice real (0-based na lista original)
// A track tem: [clone-do-último, ...originais, clone-do-primeiro]
// Índice no track = currentBanner + 1
const currentBanner = ref(0)
const carouselTransition = ref(true)
let carouselInterval = null

const carouselBanners = computed(() => {
  const banners = []
  if (storeSettings.value.banner) banners.push(storeSettings.value.banner)
  if (storeSettings.value.banners && Array.isArray(storeSettings.value.banners)) {
    storeSettings.value.banners.forEach(b => { if (b && !banners.includes(b)) banners.push(b) })
  }
  return banners
})

// Track infinita: clone-último + originais + clone-primeiro
const infiniteBanners = computed(() => {
  const list = carouselBanners.value
  if (list.length <= 1) return list
  return [list[list.length - 1], ...list, list[0]]
})

// Posição real no track (offset +1 por causa do clone-do-último no início)
const trackIndex = computed(() => {
  const list = carouselBanners.value
  if (list.length <= 1) return 0
  return currentBanner.value + 1
})

let isJumping = false

const nextBanner = () => {
  if (isJumping) return
  const len = carouselBanners.value.length
  if (len <= 1) return
  currentBanner.value++
  // Chegou no clone do primeiro → pular silenciosamente para o real
  if (currentBanner.value >= len) {
    setTimeout(() => {
      isJumping = true
      carouselTransition.value = false
      currentBanner.value = 0
      nextTick(() => {
        setTimeout(() => {
          carouselTransition.value = true
          isJumping = false
        }, 20)
      })
    }, 400)
  }
}

const prevBanner = () => {
  if (isJumping) return
  const len = carouselBanners.value.length
  if (len <= 1) return
  currentBanner.value--
  // Chegou no clone do último → pular silenciosamente para o real
  if (currentBanner.value < 0) {
    setTimeout(() => {
      isJumping = true
      carouselTransition.value = false
      currentBanner.value = len - 1
      nextTick(() => {
        setTimeout(() => {
          carouselTransition.value = true
          isJumping = false
        }, 20)
      })
    }, 400)
  }
}

const goToBanner = (i) => {
  if (isJumping) return
  currentBanner.value = i
}

const startCarousel = () => {
  stopCarousel()
  if (carouselBanners.value.length > 1) {
    carouselInterval = setInterval(nextBanner, 4000)
  }
}
const stopCarousel = () => {
  if (carouselInterval) { clearInterval(carouselInterval); carouselInterval = null }
}

// Configurações da loja
const storeSettings = ref({
  storeName: "",
  logo: "",
  banner: "",
  banners: [],
  infoImage: "",
  isOpen: false,
  deliveryMinTime: 0,
  deliveryMaxTime: 0,
  deliveryFee: 0,
  minimumOrder: 0,
  storeAddress: "",
  storePhone: "",
  whatsapp: "",
  storeLatitude: -23.5505,
  storeLongitude: -46.6333
})

// Estado de carregamento inicial
const initialLoading = ref(true)
const settingsLoaded = ref(false)
const categoriesLoaded = ref(false)

// Helper para normalizar IDs (garantir que sempre seja string)
const normalizeId = (id) => {
  if (!id) return null
  if (typeof id === 'string') return id
  if (id && typeof id.toString === 'function') return id.toString()
  return String(id)
}

// Helper para comparar IDs (funciona com string e ObjectId)
const compareIds = (id1, id2) => {
  return normalizeId(id1) === normalizeId(id2)
}

// Carregar configurações da loja
const loadStoreSettings = async () => {
  try {
    const settings = await $fetch('/api/public/settings');
    
    storeSettings.value = {
      storeName: settings.storeName || "",
      logo: settings.logo || "",
      banner: settings.banner || "",
      banners: Array.isArray(settings.banners) ? settings.banners : [],
      infoImage: settings.infoImage || "",
      isOpen: settings.isOpen || false,
      deliveryMinTime: settings.deliveryMinTime || 0,
      deliveryMaxTime: settings.deliveryMaxTime || 0,
      deliveryFee: settings.deliveryFee !== undefined ? settings.deliveryFee : 0,
      minimumOrder: settings.minimumOrder !== undefined ? settings.minimumOrder : 0,
      storeAddress: settings.storeAddress || "",
      storePhone: settings.storePhone || "",
      whatsapp: settings.whatsapp || "",
      storeLatitude: settings.storeLatitude || -23.5505,
      storeLongitude: settings.storeLongitude || -46.6333
    }
    settingsLoaded.value = true
  } catch (error) {
    console.error('Erro ao carregar configurações da loja:', error)
    // Usar valores padrão em caso de erro
    storeSettings.value = {
      storeName: "Queiroz Hamburgueria",
      logo: "/logo.jpg",
      banner: "",
      banners: [],
      isOpen: false,
      deliveryMinTime: 30,
      deliveryMaxTime: 60,
      deliveryFee: 0,
      minimumOrder: 0,
      storeAddress: "",
      storePhone: "",
      whatsapp: "",
      storeLatitude: -23.5505,
      storeLongitude: -46.6333
    }
    settingsLoaded.value = true
  }
}

// Carregar categorias com produtos da API (otimizado com lazy loading)
const loadCategories = async () => {
  try {
    loadingCategories.value = true
    
    // OTIMIZAÇÃO: Carregar apenas categorias primeiro (mais rápido)
    const apiCategories = await $fetch('/api/categories-with-products', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
    
    // Mapear categorias da API para o formato esperado
    // Filtrar categorias e produtos ocultos no frontend também (segurança dupla)
    categories.value = apiCategories
      .filter(cat => cat.isVisible !== false) // Filtrar categorias ocultas
      .map(cat => {
        const normalizedCatId = normalizeId(cat._id || cat.id)
        return {
          id: normalizedCatId,
          _id: normalizedCatId, // Manter ambos para compatibilidade
          name: cat.name,
          isVisible: cat.isVisible !== false, // Normalizar para boolean explícito
          items: (cat.items || [])
            .filter(item => item.isVisible !== false) // Filtrar produtos ocultos
            .map(item => {
              const normalizedItemId = normalizeId(item.id || item._id)
              return {
                ...item,
                id: normalizedItemId,
                _id: normalizedItemId, // Manter ambos para compatibilidade
                isVisible: item.isVisible !== false // Normalizar para boolean explícito
              }
            })
        }
      })
      .filter(cat => cat.items && cat.items.length > 0) // Remover categorias vazias
    
    // Selecionar a primeira categoria visível se houver
    if (categories.value.length > 0) {
      // Verificar se a categoria selecionada ainda existe, senão selecionar a primeira
      const normalizedSelectedCategory = normalizeId(selectedCategory.value)
      const currentCategoryExists = categories.value.some(cat => compareIds(cat.id, normalizedSelectedCategory))
      if (!currentCategoryExists) {
        selectedCategory.value = categories.value[0].id
      } else {
        // Garantir que selectedCategory está normalizado
        selectedCategory.value = normalizedSelectedCategory
      }
    } else {
      // Se não há categorias, limpar seleção
      selectedCategory.value = null
    }
    
    categoriesLoaded.value = true
  } catch (error) {
    console.error('Erro ao carregar categorias:', error)
    categories.value = []
    selectedCategory.value = null
    categoriesLoaded.value = true
  } finally {
    loadingCategories.value = false
  }
}

// OTIMIZAÇÃO: Lazy loading para produtos de categoria específica
const loadCategoryProducts = async (categoryId) => {
  try {
    const normalizedCategoryId = normalizeId(categoryId)
    const category = categories.value.find(cat => compareIds(cat.id, normalizedCategoryId))
    if (!category || category.items.length === 0) {
      // Se não tem produtos carregados, buscar da API
      const apiCategories = await $fetch('/api/categories-with-products', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
      const apiCategory = apiCategories.find(cat => compareIds(cat._id || cat.id, normalizedCategoryId))
      
      if (apiCategory && apiCategory.isVisible !== false) {
        const categoryIndex = categories.value.findIndex(cat => compareIds(cat.id, normalizedCategoryId))
        if (categoryIndex !== -1) {
          // Filtrar produtos ocultos e normalizar IDs
          const visibleItems = (apiCategory.items || [])
            .filter(item => item.isVisible !== false)
            .map(item => {
              const normalizedItemId = normalizeId(item.id || item._id)
              return {
                ...item,
                id: normalizedItemId,
                _id: normalizedItemId,
                isVisible: item.isVisible !== false
              }
            })
          
          categories.value[categoryIndex].items = visibleItems
          
          // Se a categoria ficou vazia após filtrar, removê-la
          if (visibleItems.length === 0) {
            categories.value.splice(categoryIndex, 1)
            // Selecionar outra categoria se necessário
            if (compareIds(selectedCategory.value, normalizedCategoryId) && categories.value.length > 0) {
              selectedCategory.value = categories.value[0].id
            } else if (categories.value.length === 0) {
              selectedCategory.value = null
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao carregar produtos da categoria:', error)
  }
}
// Computeds
const filteredCategories = computed(() => {
  // Filtrar categorias e produtos ocultos primeiro
  let filtered = categories.value
    .filter((cat) => cat.isVisible !== false) // Garantir que categoria está visível
    .map((cat) => ({
      ...cat,
      items: (cat.items || []).filter((item) => item.isVisible !== false) // Filtrar produtos ocultos
    }))
    .filter((cat) => cat.items && cat.items.length > 0); // Remover categorias vazias

  // Se houver busca, filtrar também os produtos
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.isVisible !== false && // Garantir que produto está visível
            (item.name?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query))
        ),
      }))
      .filter((cat) => cat.items && cat.items.length > 0);
  }

  // Verificar se a categoria selecionada ainda existe após filtros
  const normalizedSelectedCategory = normalizeId(selectedCategory.value)
  if (normalizedSelectedCategory && !filtered.some(cat => compareIds(cat.id, normalizedSelectedCategory))) {
    // Se não existe, selecionar a primeira disponível
    if (filtered.length > 0) {
      selectedCategory.value = filtered[0].id;
    } else {
      selectedCategory.value = null;
    }
  }

  return filtered;
});

// Remover computeds duplicados - já vêm do composable

const totalPrice = computed(() => {
  if (!selectedItem.value) return 0;

  const promo = getPromoAtiva(selectedItem.value)
  const basePrice = promo ? Number(promo.price) : selectedItem.value.price
  let total = basePrice * quantity.value;

  Object.entries(complementsQty.value).forEach(([name, qty]) => {
    const comp = selectedItem.value.complements.find((c) => c.name === name);
    if (comp && qty > 0) {
      total += comp.price * qty * quantity.value;
    }
  });

  return total;
});

// Formatação
const formatPrice = (value) => `R$ ${Number(value).toFixed(2).replace(".", ",")}`;

const getCategoryEmoji = (name) => {
  if (!name) return '🍽️'
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (n.includes('combo')) return '🍔'
  if (n.includes('hamburguer') || n.includes('hamburger') || n.includes('burguer') || n.includes('burger') || n.includes('smash')) return '🍔'
  if (n.includes('bebida') || n.includes('drink') || n.includes('suco') || n.includes('refrigerante') || n.includes('cerveja') || n.includes('agua')) return '🥤'
  if (n.includes('sobremesa') || n.includes('doce') || n.includes('sorvete') || n.includes('milk') || n.includes('shake') || n.includes('torta') || n.includes('bolo')) return '🍰'
  if (n.includes('pizza')) return '🍕'
  if (n.includes('frango') || n.includes('chicken') || n.includes('galinha')) return '🍗'
  if (n.includes('porcao') || n.includes('porcoes') || n.includes('porcão') || n.includes('acompanhamento') || n.includes('batata') || n.includes('frita')) return '🍟'
  if (n.includes('salada') || n.includes('vegano') || n.includes('vegetariano') || n.includes('fit')) return '🥗'
  if (n.includes('pastel') || n.includes('salgado') || n.includes('coxinha') || n.includes('empanado')) return '🥟'
  if (n.includes('lanche') || n.includes('sanduiche') || n.includes('hot dog') || n.includes('cachorro')) return '🌭'
  if (n.includes('massa') || n.includes('macarrao') || n.includes('lasanha') || n.includes('espaguete')) return '🍝'
  if (n.includes('churrasco') || n.includes('espeto') || n.includes('carne') || n.includes('steak') || n.includes('picanha')) return '🥩'
  if (n.includes('cafe') || n.includes('cappuccino') || n.includes('expresso')) return '☕'
  if (n.includes('peixe') || n.includes('frutos do mar') || n.includes('camarao') || n.includes('peixada')) return '🐟'
  return '🍽️'
}

const getPromoAtiva = (item) => {
  const p = item.promotion
  if (!p || !p.active || !p.price) return null
  const hoje = new Date().getDay()
  if (!p.dias || !p.dias.includes(hoje)) return null
  return p
}

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
      const normalizedCategoryId = normalizeId(categoryId);
      // Verificar se a categoria existe nas categorias filtradas antes de selecionar
      if (filteredCategories.value.some(cat => compareIds(cat.id, normalizedCategoryId))) {
        selectedCategory.value = normalizedCategoryId;
      }
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
  const normalizedCategoryId = normalizeId(categoryId);
  selectedCategory.value = normalizedCategoryId;
  const element = document.getElementById(`category-${normalizedCategoryId}`);

  if (element) {
    const offset = 80;
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
    (item.complements || []).map((comp) => [comp.name, 0])
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

// Função para mostrar modal de aviso
const showAlert = (title, message, type = 'warning') => {
  alertModal.value = {
    show: true,
    title,
    message,
    type
  }
}

const closeAlert = () => {
  alertModal.value.show = false
}

// Carrinho
const addToCart = () => {
  if (!selectedItem.value) return;

  // Verificar se a loja está aberta antes de permitir adicionar ao carrinho
  if (!storeSettings.value.isOpen) {
    showAlert('Loja Fechada', 'A loja está fechada no momento. Não é possível adicionar itens ao carrinho.', 'warning')
    closeModal();
    return;
  }

  // Verificar restrição de idade
  if (selectedItem.value.ageRestricted) {
    pendingAgeCallback.value = () => doAddToCart()
    showAgeModal.value = true
    return
  }

  doAddToCart()
}

const doAddToCart = () => {

  const complements = Object.entries(complementsQty.value)
    .filter(([_, qty]) => qty > 0)
    .map(([name, qty]) => {
      const comp = selectedItem.value.complements.find((c) => c.name === name);
      return { name, quantity: qty, price: comp?.price || 0 };
    });

  const promoAtiva = getPromoAtiva(selectedItem.value)
  const itemComPreco = promoAtiva
    ? { ...selectedItem.value, price: Number(promoAtiva.price) }
    : selectedItem.value
  addToCartComposable(itemComPreco, quantity.value, complements, observation.value);
  closeModal();
};

const confirmAge = () => {
  showAgeModal.value = false
  if (pendingAgeCallback.value) {
    pendingAgeCallback.value()
    pendingAgeCallback.value = null
  }
}

const cancelAge = () => {
  showAgeModal.value = false
  pendingAgeCallback.value = null
}

// Funções do carrinho já vêm do composable

const openSidebar = () => {
  showSidebar.value = true;
};

const closeSidebar = () => {
  showSidebar.value = false;
};

const finalizeOrder = () => {
  if (!storeSettings.value.isOpen) {
    showAlert('Loja Fechada', 'A loja está fechada no momento. Pedidos não podem ser realizados.', 'warning')
    return;
  }

  if (cartCount.value === 0) {
    return;
  }

  // Verificar se o cliente está logado
  if (!isCustomerIdentified.value) {
    closeSidebar()
    loginContext.value = 'order'
    localStorage.setItem('pending_order', '1')
    accountTab.value = 'login'
    showLoginModal.value = true
    return
  }
  localStorage.removeItem('pending_order')

  closeSidebar();
  navigateTo('/checkout');
};

const openStoreInfoModal = () => {
  showStoreInfoModal.value = true;
};

const closeStoreInfoModal = () => {
  showStoreInfoModal.value = false;
};

// Função para scroll até o topo
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Função para abrir modal de conta
const openAccountModal = () => {
  accountError.value = ''
  loginContext.value = 'account'
  accountTab.value = isCustomerIdentified.value ? 'perfil' : 'login'
  if (isCustomerIdentified.value && customerData.value) {
    perfilTab.value = 'dados'
    perfilSuccess.value = ''
    perfilError.value = ''
    perfilForm.value.name = customerData.value.name || ''
    perfilForm.value.phone = customerData.value.phone || ''
    perfilForm.value.zipCode = customerData.value.zipCode || ''
    perfilForm.value.address = customerData.value.address || ''
    perfilForm.value.number = customerData.value.number || ''
    perfilForm.value.neighborhood = customerData.value.neighborhood || ''
    perfilForm.value.city = customerData.value.city || ''
    perfilForm.value.currentPassword = ''
    perfilForm.value.newPassword = ''
    perfilForm.value.confirmPassword = ''
    showPasswordSection.value = false
    avatarPreview.value = customerData.value?.avatar || ''
  }
  showLoginModal.value = true
}

const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = async () => {
      // Redimensionar para no máximo 200x200
      const size = 200
      const canvas = document.createElement('canvas')
      const scale = Math.min(size / img.width, size / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const base64 = canvas.toDataURL('image/jpeg', 0.85)

      avatarPreview.value = base64
      avatarUploading.value = true
      try {
        const token = localStorage.getItem('customer_token')
        await $fetch('/api/customers/avatar', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: { avatar: base64 }
        })
        const saved = localStorage.getItem('customer_data')
        if (saved) {
          const d = JSON.parse(saved)
          d.avatar = base64
          localStorage.setItem('customer_data', JSON.stringify(d))
          customerData.value = d
        }
      } catch (err) {
        perfilError.value = 'Erro ao enviar foto'
        avatarPreview.value = ''
      } finally {
        avatarUploading.value = false
      }
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

const handleSaveAll = async () => {
  perfilError.value = ''
  perfilSuccess.value = ''

  // Validar senha se a seção estiver aberta
  if (showPasswordSection.value && perfilForm.value.newPassword) {
    if (perfilForm.value.newPassword !== perfilForm.value.confirmPassword) {
      perfilError.value = 'As senhas não coincidem'
      return
    }
    if (!perfilForm.value.currentPassword) {
      perfilError.value = 'Informe a senha atual'
      return
    }
  }

  perfilLoading.value = true
  try {
    const token = localStorage.getItem('customer_token')

    const requests = [
      $fetch('/api/customers/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: { name: perfilForm.value.name, phone: perfilForm.value.phone }
      }),
      $fetch('/api/customers/address', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          address: perfilForm.value.address,
          number: perfilForm.value.number,
          neighborhood: perfilForm.value.neighborhood,
          city: perfilForm.value.city,
          zipCode: perfilForm.value.zipCode
        }
      })
    ]

    if (showPasswordSection.value && perfilForm.value.newPassword) {
      requests.push($fetch('/api/customers/password', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: { currentPassword: perfilForm.value.currentPassword, newPassword: perfilForm.value.newPassword }
      }))
    }

    await Promise.all(requests)

    // Atualizar localStorage
    const saved = localStorage.getItem('customer_data')
    if (saved) {
      const d = JSON.parse(saved)
      d.name = perfilForm.value.name
      d.phone = perfilForm.value.phone
      d.address = perfilForm.value.address
      d.number = perfilForm.value.number
      d.neighborhood = perfilForm.value.neighborhood
      d.city = perfilForm.value.city
      d.zipCode = perfilForm.value.zipCode
      localStorage.setItem('customer_data', JSON.stringify(d))
      customerData.value = d
    }

    perfilForm.value.currentPassword = ''
    perfilForm.value.newPassword = ''
    perfilForm.value.confirmPassword = ''
    showPasswordSection.value = false
    perfilSuccess.value = 'Dados salvos com sucesso!'
  } catch (e) {
    perfilError.value = e.data?.statusMessage || 'Erro ao salvar'
  } finally {
    perfilLoading.value = false
  }
}

const logoutCustomer = () => {
  localStorage.removeItem('customer_token')
  localStorage.removeItem('customer_data')
  isCustomerIdentified.value = false
  customerData.value = null
  showLoginModal.value = false
}

const handleAccountLogin = async () => {
  accountError.value = ''
  accountLoading.value = true
  try {
    const res = await $fetch('/api/customers/login', {
      method: 'POST',
      body: { email: accountForm.value.email, password: accountForm.value.password }
    })
    localStorage.setItem('customer_token', res.token)
    localStorage.setItem('customer_data', JSON.stringify(res.customer))
    customerData.value = res.customer
    isCustomerIdentified.value = true
    const hasAddress = !!(res.customer?.address && res.customer.address.trim())
    if (loginContext.value === 'order') {
      if (hasAddress) {
        localStorage.removeItem('pending_order')
        showLoginModal.value = false
        navigateTo('/checkout')
      } else {
        accountTab.value = 'address'
      }
    } else {
      showLoginModal.value = false
    }
  } catch (e) {
    accountError.value = e.data?.statusMessage || 'Erro ao entrar'
  } finally {
    accountLoading.value = false
  }
}

const handleAccountRegister = async () => {
  accountError.value = ''
  accountLoading.value = true
  try {
    const res = await $fetch('/api/customers/register', {
      method: 'POST',
      body: accountForm.value
    })
    localStorage.setItem('customer_token', res.token)
    localStorage.setItem('customer_data', JSON.stringify(res.customer))
    customerData.value = res.customer
    isCustomerIdentified.value = true
    const hasAddress = !!(res.customer?.address && res.customer.address.trim())
    if (loginContext.value === 'order') {
      if (hasAddress) {
        localStorage.removeItem('pending_order')
        showLoginModal.value = false
        navigateTo('/checkout')
      } else {
        accountTab.value = 'address'
      }
    } else {
      showLoginModal.value = false
    }
  } catch (e) {
    accountError.value = e.data?.statusMessage || 'Erro ao cadastrar'
  } finally {
    accountLoading.value = false
  }
}

const handleSaveAddress = async () => {
  accountError.value = ''
  accountLoading.value = true
  try {
    const token = localStorage.getItem('customer_token')
    await $fetch('/api/customers/address', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        address: accountForm.value.address,
        number: accountForm.value.number,
        neighborhood: accountForm.value.neighborhood,
        city: accountForm.value.city,
        zipCode: accountForm.value.zipCode
      }
    })
    // Atualizar dados locais
    const saved = localStorage.getItem('customer_data')
    if (saved) {
      const d = JSON.parse(saved)
      d.address = accountForm.value.address
      d.number = accountForm.value.number
      d.neighborhood = accountForm.value.neighborhood
      d.city = accountForm.value.city
      d.zipCode = accountForm.value.zipCode
      localStorage.setItem('customer_data', JSON.stringify(d))
      customerData.value = d
    }
    if (loginContext.value === 'order') {
      localStorage.removeItem('pending_order')
      showLoginModal.value = false
      navigateTo('/checkout')
    } else {
      showLoginModal.value = false
    }
  } catch (e) {
    accountError.value = e.data?.statusMessage || 'Erro ao salvar endereço'
  } finally {
    accountLoading.value = false
  }
}

// Função para fechar modal de conta
const closeAccountModal = () => {
  showAccountModal.value = false;
};

// Verificar posição do scroll para destacar botão Início
const handleScrollForNavbar = () => {
  isAtTop.value = window.scrollY < 100;
};

const applyCoupon = async () => {
  if (!couponCode.value.trim()) return;
  applyingCoupon.value = true;
  try {
    const res = await fetch('/api/public/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode.value.trim(), subtotal: cartSubtotal.value })
    });
    const data = await res.json();
    if (!res.ok) {
      showAlert('Cupom inválido', data.message || 'Cupom não aplicável.', 'error');
      discountAmount.value = 0;
      appliedCoupon.value = null;
      sessionStorage.removeItem('applied_coupon');
    } else {
      discountAmount.value = data.discountAmount;
      appliedCoupon.value = data;
      couponCode.value = '';
      sessionStorage.setItem('applied_coupon', JSON.stringify(data));
      showAlert('Cupom aplicado!', `Desconto de ${data.type === 'percentage' ? data.value + '%' : 'R$ ' + data.value.toFixed(2).replace('.', ',')} aplicado.`, 'success');
    }
  } catch (e) {
    showAlert('Erro', 'Não foi possível validar o cupom.', 'error');
  } finally {
    applyingCoupon.value = false;
  }
};

const removeCoupon = () => {
  appliedCoupon.value = null;
  discountAmount.value = 0;
  couponCode.value = '';
  sessionStorage.removeItem('applied_coupon');
};

// Keyboard shortcut handler
const handleKeydown = (event) => {
  if (event.key === "Escape") {
    if (showImageOverlay.value) {
      closeImageOverlay();
    } else if (alertModal.value.show) {
      closeAlert();
    } else if (selectedItem.value) {
      closeModal();
    } else if (showSidebar.value) {
      closeSidebar();
    } else if (showStoreInfoModal.value) {
      closeStoreInfoModal();
    }
  }
};

// Mobile check
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// LocalStorage já é gerenciado pelo composable useCart

// Watchers
watch(searchQuery, () => {
  if (observer) setupIntersectionObserver();
});

// Watcher para garantir que a categoria selecionada sempre existe
watch(filteredCategories, (newCategories) => {
  // Se não há categorias, limpar seleção
  if (newCategories.length === 0) {
    selectedCategory.value = null;
    return;
  }
  
  // Se a categoria selecionada não existe mais, selecionar a primeira
  if (selectedCategory.value && !newCategories.some(cat => cat.id === selectedCategory.value)) {
    selectedCategory.value = newCategories[0].id;
  }
  
  // Se não há categoria selecionada, selecionar a primeira
  if (!selectedCategory.value && newCategories.length > 0) {
    selectedCategory.value = newCategories[0].id;
  }
  
  // Atualizar o IntersectionObserver quando as categorias mudarem
  nextTick(() => {
    setupIntersectionObserver();
  });
}, { immediate: true });

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
  if (!selectedItem.value && !showStoreInfoModal.value) {
    document.body.style.overflow = newVal ? "hidden" : "";
  }
});

watch(showStoreInfoModal, (newVal) => {
  document.body.style.overflow = newVal ? "hidden" : "";
});

watch(showLoginModal, (newVal) => {
  document.body.style.overflow = newVal ? "hidden" : "";
});

watch(showHamburgerMenu, (newVal) => {
  document.body.style.overflow = newVal ? "hidden" : "";
});

// Acompanhar pedido
const showTrackModal = ref(false)
const trackInput = ref('')
const trackLoading = ref(false)
const trackError = ref('')

const abrirTrack = async () => {
  showHamburgerMenu.value = false

  // Verificar se há pedido salvo no localStorage
  const savedId = localStorage.getItem('last_order_id')
  if (savedId) {
    try {
      const res = await fetch(`/api/public/orders/${savedId}`)
      if (res.ok) {
        const data = await res.json()
        // Se pedido ainda está em andamento, ir direto
        if (data.status !== 'delivered' && data.status !== 'cancelled') {
          navigateTo(`/pedido/${savedId}`)
          return
        }
        // Pedido já finalizado — limpar e mostrar modal manual
        localStorage.removeItem('last_order_id')
      }
    } catch {}
  }

  // Sem pedido salvo ou pedido finalizado — abrir modal manual
  trackInput.value = ''
  trackError.value = ''
  showTrackModal.value = true
}

const buscarPedidoTrack = async () => {
  const val = trackInput.value.trim()
  if (!val) { trackError.value = 'Informe o número do pedido'; return }
  trackLoading.value = true
  trackError.value = ''
  try {
    // Tentar como ID direto
    const res = await fetch(`/api/public/orders/${val}`)
    if (res.ok) {
      showTrackModal.value = false
      navigateTo(`/pedido/${val}`)
      return
    }
    // Tentar pelo número do pedido (ex: PED12345678)
    const res2 = await fetch(`/api/public/orders/numero/${val}`)
    if (res2.ok) {
      const data = await res2.json()
      localStorage.setItem('last_order_id', data._id)
      showTrackModal.value = false
      navigateTo(`/pedido/${data._id}`)
      return
    }
    trackError.value = 'Pedido não encontrado. Verifique o número e tente novamente.'
  } catch {
    trackError.value = 'Erro ao buscar pedido. Tente novamente.'
  } finally {
    trackLoading.value = false
  }
}

// Watchers do carrinho já são gerenciados pelo composable

// Watchers do carrinho já são gerenciados pelo composable

// Listener de scroll para controlar barra fixa
let scrollTimeout = null
const handleScroll = () => {
  if (scrollTimeout) return
  
  scrollTimeout = requestAnimationFrame(() => {
    const categoryTabs = document.querySelector('.category-tabs')
    if (categoryTabs) {
      const rect = categoryTabs.getBoundingClientRect()
      // Mostrar barra fixa quando a barra original sair da tela (com margem de 10px)
      showFixedCategoryBar.value = rect.top < -10
    }
    // Atualizar estado do botão Início na navbar
    handleScrollForNavbar()
    scrollTimeout = null
  })
}

// Lifecycle
onMounted(async () => {
  // Verificar se cliente está logado
  const token = localStorage.getItem('customer_token')
  if (token) {
    try {
      const data = localStorage.getItem('customer_data')
      if (data) customerData.value = JSON.parse(data)
      isCustomerIdentified.value = true
    } catch (e) {
      localStorage.removeItem('customer_token')
      localStorage.removeItem('customer_data')
    }
  }

  // Retorno do Google OAuth
  const route = useRoute()
  if (route.query.after_google === '1') {
    const pending = localStorage.getItem('pending_order') === '1'
    loginContext.value = pending ? 'order' : 'account'

    const saved = localStorage.getItem('customer_data')
    let hasAddress = false
    if (saved) {
      try {
        const d = JSON.parse(saved)
        hasAddress = !!(d.address && d.address.trim())
        accountForm.value.address = d.address || ''
        accountForm.value.number = d.number || ''
        accountForm.value.neighborhood = d.neighborhood || ''
        accountForm.value.city = d.city || ''
        accountForm.value.zipCode = d.zipCode || ''
      } catch (e) {}
    }

    if (hasAddress) {
      // Já tem endereço: se for pedido vai direto ao checkout
      if (pending) {
        localStorage.removeItem('pending_order')
        navigateTo('/checkout')
      }
      // se não for pedido, apenas fica na página já logado
    } else {
      // Sem endereço: pedir uma vez
      accountTab.value = 'address'
      showLoginModal.value = true
    }
  }

  // Carregar APIs em paralelo
  await Promise.all([
    loadStoreSettings(),
    loadCategories(),
    loadPrimaryColor()
  ]);

  // Só mostra o conteúdo depois que tudo carregou
  initialLoading.value = false;

  setupIntersectionObserver();
  checkMobile();
  window.addEventListener("resize", checkMobile);
  document.addEventListener("keydown", handleKeydown);
  
  // Adicionar listener de scroll para barra fixa
  window.addEventListener('scroll', handleScroll);

  // Iniciar carrossel após carregar settings
  startCarousel()
});

onUnmounted(() => {
  if (observer) observer.disconnect();
  window.removeEventListener("resize", checkMobile);
  window.removeEventListener('scroll', handleScroll);
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleKeydown);
  stopCarousel()
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
      <!-- Carrossel de banners -->
      <div class="banner-carousel" v-if="carouselBanners.length > 0" @mouseenter="stopCarousel" @mouseleave="startCarousel">
        <div
          class="carousel-track"
          :style="{
            transform: `translateX(-${trackIndex * 100}%)`,
            transition: carouselTransition ? 'transform 0.5s ease' : 'none'
          }"
        >
          <img
            v-for="(src, i) in infiniteBanners"
            :key="i"
            :src="src"
            alt="Banner da loja"
            class="banner carousel-slide"
          />
        </div>
        <div v-if="carouselBanners.length > 1" class="carousel-dots">
          <button
            v-for="(_, i) in carouselBanners"
            :key="i"
            :class="['carousel-dot', { active: i === currentBanner }]"
            @click="goToBanner(i)"
          />
        </div>
        <button v-if="carouselBanners.length > 1" class="carousel-arrow left" @click="prevBanner">&#8249;</button>
        <button v-if="carouselBanners.length > 1" class="carousel-arrow right" @click="nextBanner">&#8250;</button>
      </div>
      
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
          
          <!-- Botão Ver Mais -->
          <div class="info-row">
            <button class="ver-mais-btn" @click="openStoreInfoModal">
              <svg
                class="btn-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Ver Mais
            </button>
          </div>
        </div>
        <button class="hamburger-btn" @click="showHamburgerMenu = true" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
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

    <!-- Barra de categorias fixa -->
    <div
      class="category-tabs-fixed"
      v-if="!loadingCategories && filteredCategories.length && showFixedCategoryBar"
    >
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
              <div class="item-name-row">
                <h4>{{ item.name }}</h4>
                <span v-if="getPromoAtiva(item)" class="promo-badge">Promoção do Dia</span>
                <span v-if="item.ageRestricted" class="age-badge">18+</span>
              </div>
              <p>{{ item.description }}</p>
              <div class="price-row">
                <span v-if="getPromoAtiva(item)" class="price price-original">{{ formatPrice(item.price) }}</span>
                <span class="price" :class="{ 'price-promo': getPromoAtiva(item) }">{{ formatPrice(getPromoAtiva(item) ? getPromoAtiva(item).price : item.price) }}</span>
              </div>
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

  <!-- Floating Cart Button - Escondido quando navbar está visível -->
  <button v-if="cart.length > 0 && !isMobile" class="floating-cart-btn" @click="openSidebar">
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
  <footer class="footer" :class="{ 'has-cart': cart.length > 0 }">
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

  <!-- Container fixo: barra de finalizar + navbar (sempre juntos e na frente) -->
  <div class="bottom-stack">
    <Transition name="finalize-bar">
      <button v-if="cart.length > 0" class="finalize-bar" @click="openSidebar">
        <div class="finalize-bar-main">
          <div class="finalize-bar-top">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span class="finalize-bar-label">VER PEDIDO</span>
          </div>
          <div class="finalize-bar-divider"></div>
          <div class="finalize-bar-bottom">
            <span>Itens: {{ cartCount }}</span>
            <span class="finalize-bar-dot">•</span>
            <span>Total: {{ formatPrice(cartTotal) }}</span>
          </div>
        </div>
        <span class="finalize-bar-arrow">›</span>
      </button>
    </Transition>

  </div><!-- /bottom-stack -->

  <!-- Drawer Menu Hamburguer -->
  <Teleport to="body">
    <Transition name="drawer-overlay">
      <div v-if="showHamburgerMenu" class="drawer-overlay" @click="showHamburgerMenu = false"></div>
    </Transition>
    <Transition name="drawer">
      <div v-if="showHamburgerMenu" class="drawer-menu">
        <div class="drawer-header">
          <img :src="storeSettings.logo" :alt="storeSettings.storeName" class="drawer-logo" />
          <button class="drawer-close" @click="showHamburgerMenu = false">×</button>
        </div>
        <nav class="drawer-nav">
          <button class="drawer-item" @click="scrollToTop(); showHamburgerMenu = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Início
          </button>
          <button class="drawer-item" @click="openSidebar(); showHamburgerMenu = false">
            <div style="position:relative;display:flex;align-items:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span v-if="cartCount > 0" class="drawer-badge">{{ cartCount }}</span>
            </div>
            Carrinho
          </button>
          <button class="drawer-item" @click="openAccountModal(); showHamburgerMenu = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Conta
          </button>
          <button class="drawer-item" @click="abrirTrack()">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="2"></rect>
              <path d="M16 8h4l3 3v5h-7V8z"></path>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            Acompanhar Pedido
          </button>
          <button class="drawer-item" @click="openStoreInfoModal(); showHamburgerMenu = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Informações
          </button>
        </nav>
      </div>
    </Transition>

    <!-- Modal acompanhar pedido -->
    <Transition name="fade">
      <div v-if="showTrackModal" class="track-overlay" @click.self="showTrackModal = false">
        <div class="track-modal">
          <div class="track-modal-header">
            <div class="track-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13" rx="2"></rect>
                <path d="M16 8h4l3 3v5h-7V8z"></path>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div>
              <h3>Acompanhar Pedido</h3>
              <p>Informe o número do seu pedido</p>
            </div>
            <button class="track-close" @click="showTrackModal = false">×</button>
          </div>
          <div class="track-body">
            <input
              v-model="trackInput"
              type="text"
              placeholder="Ex: PED12345678"
              class="track-input"
              @keydown.enter="buscarPedidoTrack"
              autofocus
            />
            <p v-if="trackError" class="track-error">{{ trackError }}</p>
            <button @click="buscarPedidoTrack" class="track-btn" :disabled="trackLoading">
              {{ trackLoading ? 'Buscando...' : 'Ver meu pedido' }}
            </button>
            <p class="track-hint">O número do pedido foi enviado na confirmação.</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

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
              <b>{{ comp.quantity }}x</b> {{ comp.name }}
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

      <!-- Cupom de desconto -->
      <div class="coupon-section">
        <div v-if="appliedCoupon" class="coupon-applied">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>Cupom <strong>{{ appliedCoupon.code }}</strong> aplicado!</span>
          <button @click="removeCoupon" class="coupon-remove-btn" type="button">✕</button>
        </div>
        <div v-else class="coupon-input-row">
          <input
            type="text"
            v-model="couponCode"
            placeholder="Código do cupom"
            class="coupon-input"
            @keydown.enter="applyCoupon"
          />
          <button class="apply-coupon-btn" @click="applyCoupon" :disabled="applyingCoupon || !couponCode.trim()">
            {{ applyingCoupon ? '...' : 'Aplicar' }}
          </button>
        </div>
      </div>
      
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
      
      
      <div class="total">
        <span class="total-label">Total</span>
        <span class="total-value">{{ formatPrice(Math.max(0, cartSubtotal - discountAmount)) }}</span>
      </div>
      <button 
        class="finalize-btn" 
        @click="finalizeOrder" 
        :disabled="cartCount === 0 || !storeSettings.isOpen"
        :title="!storeSettings.isOpen ? 'A loja está fechada. Pedidos não podem ser realizados.' : (cartCount === 0 ? 'Carrinho vazio' : 'Finalizar pedido')"
      >
        <span class="btn-content">
          <svg v-if="cartCount > 0 && storeSettings.isOpen" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2s-.9-2-2-2m10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2s2-.9 2-2s-.9-2-2-2m-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03L21 4.96L19.25 4l-3.7 7H8.53L4.27 2H1v2h2l3.6 7.59l-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7zM12 2l4 4l-4 4l-1.41-1.41L12.17 7H8V5h4.17l-1.59-1.59z"/>
          </svg>
          <svg v-else-if="!storeSettings.isOpen" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          {{ !storeSettings.isOpen ? 'Loja Fechada' : (cartCount > 0 ? 'Finalizar Pedido' : 'Carrinho vazio') }}
        </span>
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

              <div class="complements-section" v-if="selectedItem.complements && selectedItem.complements.length > 0">
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

  <!-- Store Info Modal -->
  <StoreInfoModal
    :show="showStoreInfoModal"
    :storeSettings="storeSettings"
    @close="closeStoreInfoModal"
  />
  
  <!-- Modal de Conta do Cliente -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showLoginModal" class="alert-modal-overlay" @click="showLoginModal = false">
        <div class="account-modal" @click.stop>

          <!-- PERFIL (logado) -->
          <div v-if="accountTab === 'perfil'" class="account-section perfil-section">
            <div class="account-modal-header">
              <h3>Minha Conta</h3>
              <button @click="showLoginModal = false" class="close-modal-btn">×</button>
            </div>

            <!-- Avatar + info -->
            <div class="perfil-avatar-block">
              <label class="avatar-upload-label" :class="{ 'avatar-uploading': avatarUploading }">
                <input type="file" accept="image/*" class="avatar-file-input" @change="handleAvatarChange" />
                <div class="account-avatar perfil-avatar-lg">
                  <img v-if="avatarPreview" :src="avatarPreview" class="avatar-img" alt="Foto de perfil" />
                  <span v-else>{{ customerData?.name?.charAt(0)?.toUpperCase() || '?' }}</span>
                </div>
                <div class="avatar-overlay">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </label>
              <div class="perfil-avatar-info">
                <p class="account-name">{{ customerData?.name }}</p>
                <p class="account-email">{{ customerData?.email }}</p>
                <p class="avatar-hint">{{ avatarUploading ? 'Enviando...' : 'Clique na foto para alterar' }}</p>
              </div>
            </div>

            <!-- Formulário unificado -->
            <form @submit.prevent="handleSaveAll" class="account-form perfil-form">
              <p class="perfil-section-title">Dados Pessoais</p>
              <label class="perfil-label">Nome completo</label>
              <input v-model="perfilForm.name" type="text" placeholder="Seu nome" required />
              <label class="perfil-label">Telefone</label>
              <input v-model="perfilForm.phone" type="tel" placeholder="(00) 00000-0000" />
              <label class="perfil-label">Email</label>
              <input :value="customerData?.email" type="email" disabled class="input-disabled" />

              <p class="perfil-section-title" style="margin-top: 0.75rem;">Endereço</p>
              <label class="perfil-label">CEP</label>
              <input v-model="perfilForm.zipCode" type="text" placeholder="00000-000" />
              <label class="perfil-label">Rua / Avenida</label>
              <input v-model="perfilForm.address" type="text" placeholder="Nome da rua" />
              <div class="form-row">
                <div>
                  <label class="perfil-label">Número</label>
                  <input v-model="perfilForm.number" type="text" placeholder="Nº" />
                </div>
                <div>
                  <label class="perfil-label">Bairro</label>
                  <input v-model="perfilForm.neighborhood" type="text" placeholder="Bairro" />
                </div>
              </div>
              <label class="perfil-label">Cidade</label>
              <input v-model="perfilForm.city" type="text" placeholder="Cidade" />

              <!-- Alterar senha (expansível) -->
              <button type="button" class="toggle-senha-btn" @click="showPasswordSection = !showPasswordSection; perfilError = ''; perfilSuccess = ''">
                {{ showPasswordSection ? '− Cancelar alteração de senha' : '+ Alterar senha' }}
              </button>
              <div v-if="showPasswordSection" class="senha-section">
                <label class="perfil-label">Senha atual</label>
                <input v-model="perfilForm.currentPassword" type="password" placeholder="••••••••" />
                <label class="perfil-label">Nova senha</label>
                <input v-model="perfilForm.newPassword" type="password" placeholder="Mínimo 6 caracteres" />
                <label class="perfil-label">Confirmar nova senha</label>
                <input v-model="perfilForm.confirmPassword" type="password" placeholder="Repita a nova senha" />
              </div>

              <p v-if="perfilSuccess" class="account-success">✓ {{ perfilSuccess }}</p>
              <p v-if="perfilError" class="account-error">{{ perfilError }}</p>
              <button type="submit" class="account-submit-btn" :disabled="perfilLoading">
                {{ perfilLoading ? 'Salvando...' : 'Salvar' }}
              </button>
            </form>

            <button @click="logoutCustomer" class="logout-btn">Sair da conta</button>
          </div>

          <!-- LOGIN -->
          <div v-else-if="accountTab === 'login'" class="account-section">
            <div class="account-modal-header">
              <h3>Entrar</h3>
              <button @click="showLoginModal = false" class="close-modal-btn">×</button>
            </div>
            <a href="/api/auth/google?mode=cliente" class="google-login-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Entrar com Google
            </a>
            <div class="account-divider"><span>ou</span></div>
            <form @submit.prevent="handleAccountLogin" class="account-form">
              <input v-model="accountForm.email" type="email" placeholder="Email" required />
              <input v-model="accountForm.password" type="password" placeholder="Senha" required />
              <p v-if="accountError" class="account-error">{{ accountError }}</p>
              <button type="submit" class="account-submit-btn" :disabled="accountLoading">
                {{ accountLoading ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>
            <p class="account-switch">Não tem conta? <button @click="accountTab = 'register'">Cadastrar</button></p>
          </div>

          <!-- CADASTRO -->
          <div v-else-if="accountTab === 'register'" class="account-section">
            <div class="account-modal-header">
              <h3>Criar Conta</h3>
              <button @click="showLoginModal = false" class="close-modal-btn">×</button>
            </div>
            <form @submit.prevent="handleAccountRegister" class="account-form">
              <input v-model="accountForm.name" type="text" placeholder="Nome completo *" required />
              <input v-model="accountForm.email" type="email" placeholder="Email *" required />
              <input v-model="accountForm.phone" type="tel" placeholder="Telefone *" required />
              <input v-model="accountForm.password" type="password" placeholder="Senha *" required />
              <hr class="form-divider" />
              <input v-model="accountForm.zipCode" type="text" placeholder="CEP" />
              <input v-model="accountForm.address" type="text" placeholder="Endereço" />
              <div class="form-row">
                <input v-model="accountForm.number" type="text" placeholder="Número" />
                <input v-model="accountForm.neighborhood" type="text" placeholder="Bairro" />
              </div>
              <input v-model="accountForm.city" type="text" placeholder="Cidade" />
              <p v-if="accountError" class="account-error">{{ accountError }}</p>
              <button type="submit" class="account-submit-btn" :disabled="accountLoading">
                {{ accountLoading ? 'Cadastrando...' : 'Criar Conta' }}
              </button>
            </form>
            <p class="account-switch">Já tem conta? <button @click="accountTab = 'login'">Entrar</button></p>
          </div>

          <!-- ENDEREÇO (pós Google login) -->
          <div v-else-if="accountTab === 'address'" class="account-section">
            <div class="account-modal-header">
              <h3>Seu Endereço</h3>
              <button @click="showLoginModal = false" class="close-modal-btn">×</button>
            </div>
            <p class="account-subtitle">Para continuar, informe seu endereço de entrega.</p>
            <form @submit.prevent="handleSaveAddress" class="account-form">
              <input v-model="accountForm.zipCode" type="text" placeholder="CEP" />
              <input v-model="accountForm.address" type="text" placeholder="Endereço *" required />
              <div class="form-row">
                <input v-model="accountForm.number" type="text" placeholder="Número *" required />
                <input v-model="accountForm.neighborhood" type="text" placeholder="Bairro" />
              </div>
              <input v-model="accountForm.city" type="text" placeholder="Cidade" />
              <p v-if="accountError" class="account-error">{{ accountError }}</p>
              <button type="submit" class="account-submit-btn" :disabled="accountLoading">
                {{ accountLoading ? 'Salvando...' : 'Salvar Endereço' }}
              </button>
            </form>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Modal de Alerta -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showAgeModal" class="alert-modal-overlay" @click="cancelAge">
        <div class="alert-modal age-modal" @click.stop>
          <div class="age-modal-icon">18+</div>
          <h3>Confirmação de Idade</h3>
          <p>Este produto é permitido apenas para maiores de 18 anos. Você confirma que tem 18 anos ou mais?</p>
          <div class="age-modal-actions">
            <button @click="cancelAge" class="age-btn-cancel">Não tenho 18 anos</button>
            <button @click="confirmAge" class="age-btn-confirm">Sim, tenho 18+</button>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="modal">
      <div v-if="alertModal.show" class="alert-modal-overlay" @click="closeAlert">
        <div class="alert-modal" @click.stop>
          <div class="alert-modal-header">
            <div class="alert-icon" :class="alertModal.type">
              <svg v-if="alertModal.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <svg v-else-if="alertModal.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </div>
            <h3>{{ alertModal.title }}</h3>
          </div>
          <div class="alert-modal-content">
            <p>{{ alertModal.message }}</p>
          </div>
          <div class="alert-modal-actions">
            <button @click="closeAlert" class="alert-btn-ok">
              Entendi
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
  padding-bottom: 70px; /* barra ver pedido */
}

body {
  overflow-x: hidden; /* Previne scroll horizontal global */
}

.alert {
  background-color: var(--color-primary-hover, #e67e22);
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

.banner-carousel {
  position: relative;
  width: 100%;
  height: 328px;
  border-radius: 1rem;
  overflow: hidden;
}

.carousel-track {
  display: flex;
  height: 100%;
}

.carousel-slide {
  min-width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
}

.carousel-dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 5px 8px;
  border-radius: 20px;
}

.carousel-dot {
  width: 6px !important;
  height: 6px !important;
  border-radius: 50% !important;
  border: none !important;
  background: rgba(255, 255, 255, 0.5) !important;
  cursor: pointer;
  padding: 0 !important;
  margin: 0 !important;
  transition: all 0.3s ease;
  flex-shrink: 0;
  min-width: unset !important;
  min-height: unset !important;
  box-shadow: none !important;
}

.carousel-dot.active {
  background: white !important;
  width: 18px !important;
  border-radius: 3px !important;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.35);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

@media (max-width: 480px) {
  .carousel-arrow {
    display: none; /* em telas muito pequenas, usar apenas os dots */
  }
}

.carousel-arrow:hover {
  background: rgba(0,0,0,0.6);
}

.carousel-arrow.left { left: 10px; }
.carousel-arrow.right { right: 10px; }

.banner {
  width: 100%;
  height: 328px;
  object-fit: cover;
  border-radius: 1rem;
}

@media (max-width: 768px) {
  .banner-carousel {
    height: 200px;
    border-radius: 0.5rem;
  }
  .banner {
    height: 200px;
    border-radius: 0.5rem;
  }
}

.profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

@media (max-width: 480px) {
  .profile {
    align-items: center;
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

.ver-mais-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary, #ff8e24);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.ver-mais-btn:hover {
  background: var(--color-primary-hover, #e67e22);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 142, 36, 0.3);
}

.btn-icon {
  flex-shrink: 0;
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
  color: var(--color-primary, #ff8e24);
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

.category-tabs-fixed {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  width: 100%;
  max-width: 1400px;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 2rem;
  background: rgba(248, 250, 252, 0.95);
  backdrop-filter: blur(10px);
  scrollbar-width: none;
  animation: slideDown 0.15s ease-in-out;
}

.category-tabs-fixed::-webkit-scrollbar {
  display: none;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
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
  background: var(--color-primary, #ff8e24);
  color: #fff;
  border-color: var(--color-primary, #ff8e24);
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
  color: var(--color-primary, #ff8e24);
  font-size: 1rem;
  margin-top: auto;
}
.price-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: auto;
  flex-wrap: wrap;
}
.price-original {
  font-size: 0.8rem;
  font-weight: 500;
  color: #aaa;
  text-decoration: line-through;
  margin-top: 0;
}
.price-promo {
  color: #16a34a;
}
.item-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.promo-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
}

.age-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

/* Modal de idade */
.age-modal {
  text-align: center;
  padding: 2rem 1.5rem;
  max-width: 340px;
}

.age-modal-icon {
  font-size: 2.5rem;
  font-weight: 900;
  color: #dc2626;
  background: #fef2f2;
  border: 3px solid #fca5a5;
  border-radius: 50%;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  letter-spacing: -1px;
}

.age-modal h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
  color: #1e293b;
}

.age-modal p {
  color: #64748b;
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0 0 1.5rem;
}

.age-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.age-btn-confirm {
  padding: 0.75rem;
  background: var(--color-primary, #ff8e24);
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s;
}
.age-btn-confirm:hover { filter: brightness(0.9); }

.age-btn-cancel {
  padding: 0.75rem;
  background: #f1f5f9;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.age-btn-cancel:hover { background: #e2e8f0; }

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
  color: #666;
  font-size: 0.875rem;
  margin-top: 1rem;
  padding: 1rem 0 0.75rem;
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
  color: var(--color-primary, #ff8e24);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.social-links a:hover {
  color: var(--color-primary-hover, #e67e22);
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

/* Container fixo que agrupa barra + navbar */
.bottom-stack {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 500;
  display: flex;
  flex-direction: column;
}

/* Barra de finalizar pedido */
.finalize-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0.75rem 0.3rem;
  padding: 0.6rem 0.75rem 0.6rem 0.75rem;
  min-height: 56px;
  background: var(--color-primary);
  border-radius: 12px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, background 0.15s ease;
  text-align: left;
}

.finalize-bar:active {
  transform: scale(0.97);
}

.finalize-bar:hover {
  background: var(--color-primary-hover);
}

.finalize-bar-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.finalize-bar-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.finalize-bar-label {
  color: white;
  font-size: 0.875rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.finalize-bar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.finalize-bar-bottom {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.8rem;
  font-weight: 500;
}

.finalize-bar-dot {
  font-size: 0.4rem;
  opacity: 0.7;
}

.finalize-bar-arrow {
  color: rgba(255, 255, 255, 0.7);
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
  margin-left: 0.5rem;
  font-weight: 300;
}

.finalize-bar-enter-active,
.finalize-bar-leave-active {
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}

.finalize-bar-enter-from,
.finalize-bar-leave-to {
  transform: translateY(120%);
  opacity: 0;
}

/* Hamburguer button */
.hamburger-btn {
  position: absolute;
  right: 0;
  top: 0;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}

.hamburger-btn:hover {
  background: var(--color-primary-hover);
}

.hamburger-btn span {
  display: block;
  width: 16px;
  height: 2px;
  background: white;
  border-radius: 2px;
}

/* Drawer menu lateral */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 600;
  backdrop-filter: blur(2px);
}

.drawer-menu {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: white;
  z-index: 601;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0,0,0,0.15);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-logo {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: cover;
}

.drawer-close {
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  border-radius: 0;
}

.drawer-item:hover {
  background: #f9f9f9;
  color: var(--color-primary);
}

.drawer-item svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.drawer-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  border: 2px solid white;
}

.drawer-overlay-enter-active, .drawer-overlay-leave-active { transition: opacity 0.25s ease; }
.drawer-overlay-enter-from, .drawer-overlay-leave-to { opacity: 0; }
.drawer-enter-active, .drawer-leave-active { transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(-100%); }

/* Modal acompanhar pedido */
.track-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}
.track-modal {
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.track-modal-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}
.track-icon {
  width: 48px;
  height: 48px;
  background: #fff3e8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary-color, #f97316);
}
.track-modal-header h3 { margin: 0; font-size: 1rem; }
.track-modal-header p { margin: 0.1rem 0 0; font-size: 0.8rem; color: #888; }
.track-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #aaa;
  cursor: pointer;
  padding: 0 0.25rem;
}
.track-close:hover { color: #555; }
.track-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.track-input {
  width: 100%;
  box-sizing: border-box;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.track-input:focus { border-color: var(--primary-color, #f97316); }
.track-error {
  margin: 0;
  font-size: 0.82rem;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}
.track-btn {
  width: 100%;
  background: var(--primary-color, #f97316);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.8rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.track-btn:hover:not(:disabled) { opacity: 0.88; }
.track-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.track-hint {
  margin: 0;
  font-size: 0.78rem;
  color: #aaa;
  text-align: center;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Floating Cart Button - Esconder quando navbar estiver visível */
.floating-cart-btn {
  position: fixed;
  bottom: 80px; /* Acima da navbar */
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary, #ff8e24);
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
  background: var(--color-primary-hover, #e67e22);
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
  width: 44px;
  height: 44px;
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

/* Modal de Alerta */
.alert-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.alert-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: alertModalSlideIn 0.3s ease-out;
}

@keyframes alertModalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.alert-modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.alert-icon.warning {
  background: #fbbf24;
  color: #92400e;
}

.alert-icon.error {
  background: #ef4444;
  color: white;
}

.alert-icon.info {
  background: #3b82f6;
  color: white;
}

.alert-modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

.alert-modal-content {
  padding: 1.5rem;
}

.alert-modal-content p {
  margin: 0;
  color: #374151;
  line-height: 1.6;
  font-size: 0.9375rem;
}

.alert-modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

.alert-btn-ok {
  padding: 0.75rem 1.5rem;
  background: #ff8e24;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.alert-btn-ok:hover {
  background: #e67e22;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.3);
}

.alert-btn-ok:active {
  transform: translateY(0);
}

.login-modal {
  text-align: center;
}

.login-actions {
  flex-direction: column;
  gap: 0.75rem;
}

.google-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background: white;
  color: #3f3f3f;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.google-login-btn:hover {
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.alert-btn-cancel {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
}

.alert-btn-cancel:hover {
  background: #f5f5f5;
}

.account-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.account-section {
  padding: 1.5rem;
}

.account-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.account-modal-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.close-modal-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  line-height: 1;
  padding: 0;
}

.account-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.account-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.account-name {
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0 0 0.25rem;
}

.account-email {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.logout-btn {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: var(--color-error, #e53e3e);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.logout-btn:hover {
  background: #fff5f5;
}

.account-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  margin: 1rem 0;
}

.account-divider::before,
.account-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.account-form input {
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.account-form input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 0.25rem 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.account-submit-btn {
  padding: 0.875rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.25rem;
}

.account-submit-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.account-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.account-error {
  color: var(--color-error, #e53e3e);
  font-size: 0.875rem;
  margin: 0;
}

.account-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem;
  text-align: center;
}

.account-switch {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.account-switch button {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

/* Perfil expandido */
.perfil-avatar-block {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f0f0f0;
}

.perfil-avatar-lg {
  width: 56px;
  height: 56px;
  font-size: 1.5rem;
  flex-shrink: 0;
  margin: 0;
}

.perfil-avatar-info {
  min-width: 0;
}

.perfil-avatar-info .account-name {
  font-size: 1rem;
  margin: 0 0 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perfil-avatar-info .account-email {
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perfil-form {
  margin-bottom: 1rem;
}

.perfil-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem;
}

.perfil-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
  display: block;
}

.input-disabled {
  background: #f5f5f5;
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.toggle-senha-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0;
  text-align: left;
  margin-top: 0.25rem;
}

.senha-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
}

.account-success {
  color: #38a169;
  font-size: 0.875rem;
  margin: 0;
  font-weight: 500;
}

/* Upload de avatar */
.avatar-upload-label {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.avatar-file-input {
  display: none;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-upload-label:hover .avatar-overlay,
.avatar-uploading .avatar-overlay {
  opacity: 1;
}

.avatar-uploading .avatar-overlay {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.avatar-hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0.2rem 0 0;
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
    padding: 0.75rem 0;
    margin-top: 0.5rem;
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

  .ver-mais-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
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

  .category-tabs-fixed {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }

  .category-tabs-fixed .tab {
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
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
  }

  .qty-value {
    font-size: 1rem;
  }

  .add-to-cart {
    padding: 0.75rem;
    font-size: 0.875rem;
  }

  .footer {
    padding: 0.75rem 0;
    margin-top: 0.5rem;
  }

  .footer-content {
    margin-bottom: 1rem;
    padding: 0 0.5rem;
    gap: 1.5rem;
  }


  .floating-cart-btn {
    bottom: 75px; /* Ajustar para telas pequenas */
    width: calc(100% - 2rem);
    max-width: 300px;
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
    width: 40px;
    height: 40px;
    font-size: 0.95rem;
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
    gap: 6px;
  }
  
  .btn-content {
    gap: 6px;
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

  .banner-carousel {
    height: 160px;
    border-radius: 0.35rem;
  }

  .banner {
    height: 160px;
  }

  .modal-image {
    height: 200px;
  }

  .profile img {
    width: 65px;
    height: 65px;
  }

  .ver-mais-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  .category-tabs-fixed {
    padding: 0.75rem 0.5rem;
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
    width: 44px;
    height: 44px;
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
    gap: 4px;
  }
  
  .btn-content {
    gap: 4px;
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