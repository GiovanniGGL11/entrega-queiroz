<script setup>
import { ref, computed, onMounted } from "vue";
import { useCart } from '~/composables/useCart'

// Usar o composable do carrinho
const { cart, cartSubtotal, cartTotal, removeFromCart, updateCartQuantity, clearCart } = useCart()

// Estado do formulário
const customerInfo = ref({
  name: '',
  phone: '',
  email: ''
})

const deliveryInfo = ref({
  address: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  zipCode: '',
  deliveryFee: 0,
  latitude: null,
  longitude: null,
  deliveryZone: '',
  estimatedTime: '',
  canDeliver: false
})

const paymentMethod = ref('pix')
const notes = ref('')

// Estado de carregamento
const isSubmitting = ref(false)
const orderSubmitted = ref(false)
const orderNumber = ref('')
const isValidatingAddress = ref(false)
const addressValidationError = ref('')
let addressValidationTimeout = null

// Configurações da loja
const storeSettings = ref({
  storeName: "",
  logo: "",
  banner: "",
  isOpen: false,
  deliveryMinTime: 0,
  deliveryMaxTime: 0,
  deliveryFee: 0,
  minimumOrder: 0,
  checkoutFields: {
    customerName: { enabled: true, required: true },
    customerPhone: { enabled: true, required: true },
    customerEmail: { enabled: true, required: false },
    deliveryAddress: { enabled: true, required: true },
    deliveryComplement: { enabled: true, required: false },
    deliveryNeighborhood: { enabled: true, required: true },
    deliveryCity: { enabled: true, required: true },
    deliveryZipCode: { enabled: true, required: true },
    paymentMethod: { enabled: true, required: true },
    notes: { enabled: true, required: false }
  }
})

// Carregar configurações da loja
const loadStoreSettings = async () => {
  try {
    const settings = await $fetch('/api/public/settings')
    storeSettings.value = {
      storeName: settings.storeName || "",
      logo: settings.logo || "",
      banner: settings.banner || "",
      isOpen: settings.isOpen || false,
      deliveryMinTime: settings.deliveryMinTime || 0,
      deliveryMaxTime: settings.deliveryMaxTime || 0,
      deliveryFee: settings.deliveryFee !== undefined ? settings.deliveryFee : 0,
      minimumOrder: settings.minimumOrder !== undefined ? settings.minimumOrder : 0,
      checkoutFields: settings.checkoutFields || {
        customerName: { enabled: true, required: true },
        customerPhone: { enabled: true, required: true },
        customerEmail: { enabled: true, required: false },
        deliveryAddress: { enabled: true, required: true },
        deliveryComplement: { enabled: true, required: false },
        deliveryNeighborhood: { enabled: true, required: true },
        deliveryCity: { enabled: true, required: true },
        deliveryZipCode: { enabled: true, required: true },
        paymentMethod: { enabled: true, required: true },
        notes: { enabled: true, required: false }
      }
    }
    
    // Não definir taxa de entrega padrão - será calculada via CEP
  } catch (error) {
    console.error('Erro ao carregar configurações da loja:', error)
  }
}

// Função para formatar CEP automaticamente
const formatZipCode = (value) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 5) {
    return numbers
  } else {
    return numbers.substring(0, 5) + '-' + numbers.substring(5, 8)
  }
}

// Função para validação automática com debounce
const validateAddressAutomatically = () => {
  // Limpar timeout anterior se existir
  if (addressValidationTimeout) {
    clearTimeout(addressValidationTimeout)
  }

  // Limpar estado de erro temporariamente
  addressValidationError.value = ''

  // Verificar se o CEP está preenchido e tem 8 dígitos
  if (!deliveryInfo.value.zipCode || deliveryInfo.value.zipCode.replace(/\D/g, '').length !== 8) {
    return
  }

  // Aguardar 1 segundo após parar de digitar o CEP
  addressValidationTimeout = setTimeout(() => {
    validateAddress()
  }, 1000)
}

// Função para validar CEP e calcular frete
const validateAddress = async () => {
  if (!deliveryInfo.value.zipCode) {
    addressValidationError.value = 'CEP é obrigatório para calcular o frete'
    return false
  }

  isValidatingAddress.value = true
  addressValidationError.value = ''

  try {
    const cleanZipCode = deliveryInfo.value.zipCode.replace(/\D/g, '')

    // Buscar informações do CEP usando ViaCEP
    const cepResponse = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)
    const cepData = await cepResponse.json()

    if (cepData.erro) {
      addressValidationError.value = 'CEP inválido ou não encontrado'
      return false
    }

    // Preencher automaticamente os campos com os dados do CEP
    if (cepData.logradouro && !deliveryInfo.value.address) {
      deliveryInfo.value.address = cepData.logradouro
    }
    if (cepData.bairro && !deliveryInfo.value.neighborhood) {
      deliveryInfo.value.neighborhood = cepData.bairro
    }
    if (cepData.localidade && !deliveryInfo.value.city) {
      deliveryInfo.value.city = cepData.localidade
    }

    // Calcular frete baseado no CEP
    const deliveryResponse = await $fetch('/api/calculate-delivery', {
      method: 'POST',
      body: {
        zipCode: cleanZipCode
      }
    })

    if (!deliveryResponse.canDeliver) {
      addressValidationError.value = deliveryResponse.message
      deliveryInfo.value.canDeliver = false
      return false
    }

    // Atualizar informações de entrega
    deliveryInfo.value.deliveryFee = deliveryResponse.deliveryFee
    deliveryInfo.value.deliveryZone = deliveryResponse.deliveryZone
    deliveryInfo.value.estimatedTime = deliveryResponse.estimatedTime
    deliveryInfo.value.canDeliver = true
    addressValidationError.value = ''

    return true
  } catch (error) {
    console.error('Erro ao validar CEP:', error)
    addressValidationError.value = 'Erro ao validar CEP. Tente novamente.'
    return false
  } finally {
    isValidatingAddress.value = false
  }
}

// Computeds
const totalAmount = computed(() => {
  return cartSubtotal.value + deliveryInfo.value.deliveryFee
})

const formatPrice = (value) => `R$ ${value.toFixed(2).replace(".", ",")}`

// Validação
// Validação do formulário
const isFormValid = computed(() => {
  const fields = storeSettings.value.checkoutFields
  
  // Verificar campos obrigatórios habilitados
  const requiredFields = [
    { field: 'customerName', value: customerInfo.value.name, enabled: fields.customerName.enabled, required: fields.customerName.required },
    { field: 'customerPhone', value: customerInfo.value.phone, enabled: fields.customerPhone.enabled, required: fields.customerPhone.required },
    { field: 'customerEmail', value: customerInfo.value.email, enabled: fields.customerEmail.enabled, required: fields.customerEmail.required },
    { field: 'deliveryAddress', value: deliveryInfo.value.address, enabled: fields.deliveryAddress.enabled, required: fields.deliveryAddress.required },
    { field: 'deliveryNumber', value: deliveryInfo.value.number, enabled: true, required: true },
    { field: 'deliveryComplement', value: deliveryInfo.value.complement, enabled: fields.deliveryComplement.enabled, required: fields.deliveryComplement.required },
    { field: 'deliveryNeighborhood', value: deliveryInfo.value.neighborhood, enabled: fields.deliveryNeighborhood.enabled, required: fields.deliveryNeighborhood.required },
    { field: 'deliveryCity', value: deliveryInfo.value.city, enabled: fields.deliveryCity.enabled, required: fields.deliveryCity.required },
    { field: 'deliveryZipCode', value: deliveryInfo.value.zipCode, enabled: fields.deliveryZipCode.enabled, required: fields.deliveryZipCode.required },
    { field: 'paymentMethod', value: paymentMethod.value, enabled: fields.paymentMethod.enabled, required: fields.paymentMethod.required },
    { field: 'notes', value: notes.value, enabled: fields.notes.enabled, required: fields.notes.required }
  ]
  
  // Verificar se todos os campos obrigatórios habilitados estão preenchidos
  const allRequiredFieldsFilled = requiredFields.every(({ enabled, required, value }) => {
    if (!enabled || !required) return true
    return value && value.trim() !== ''
  })
  
  return allRequiredFieldsFilled && 
         deliveryInfo.value.canDeliver && 
         !addressValidationError.value && 
         deliveryInfo.value.deliveryFee > 0 &&
         cart.value.length > 0
})

// Submeter pedido
const submitOrder = async () => {
  if (!isFormValid.value || cart.length === 0) return
  
  isSubmitting.value = true
  
  try {
    // Gerar número do pedido
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 1000)
    orderNumber.value = `#${timestamp.toString().slice(-6)}${randomNum.toString().padStart(3, '0')}`
    
    // Preparar dados do pedido - APENAS dados que devem vir do frontend
    const orderData = {
      customerInfo: {
        name: customerInfo.value.name.trim(),
        phone: customerInfo.value.phone.trim(),
        email: customerInfo.value.email.trim()
      },
      deliveryInfo: {
        address: deliveryInfo.value.address.trim(),
        number: deliveryInfo.value.number.trim(),
        complement: deliveryInfo.value.complement.trim(),
        neighborhood: deliveryInfo.value.neighborhood.trim(),
        city: deliveryInfo.value.city.trim(),
        zipCode: deliveryInfo.value.zipCode.trim(),
        latitude: deliveryInfo.value.latitude,
        longitude: deliveryInfo.value.longitude
      },
      items: cart.value.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        complements: item.complements || []
      })),
      paymentMethod: paymentMethod.value,
      notes: notes.value.trim()
    }
    
    // Enviar para API
    const response = await $fetch('/api/orders', {
      method: 'POST',
      body: orderData
    })
    
    if (response.success) {
      orderSubmitted.value = true
      clearCart()
    } else {
      throw new Error(response.message || 'Erro ao processar pedido')
    }
    
  } catch (error) {
    console.error('Erro ao submeter pedido:', error)
    
    // Verificar se é um erro de validação ou de rede
    let errorMessage = 'Erro ao processar pedido. Tente novamente.'
    
    if (error.data?.message) {
      errorMessage = error.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    alert(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

// Voltar para o menu
const goBackToMenu = () => {
  navigateTo('/')
}

// Lifecycle
onMounted(async () => {
  await loadStoreSettings()
  
  // Se não há itens no carrinho, redirecionar para o menu
  if (cart.length === 0) {
    navigateTo('/')
  }
})

// Meta da página
useHead({
  title: () => `Checkout - ${storeSettings.value.storeName || 'Delivery App'}`,
})
</script>

<template>
  <div class="checkout-page">
    <!-- Loading Screen -->
    <div v-if="!storeSettings.storeName" class="page-wrapper">
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>Carregando checkout...</p>
        </div>
      </div>
    </div>

    <!-- Conteúdo Principal -->
    <div v-else class="page-wrapper">
      <div class="container">
        <!-- Header -->
        <div class="checkout-header">
          <button @click="goBackToMenu" class="back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Voltar ao Menu
          </button>
          
          <div class="header-info">
            <img v-if="storeSettings.logo" :src="storeSettings.logo" :alt="storeSettings.storeName" class="logo" />
            <h1>{{ storeSettings.storeName }}</h1>
          </div>
        </div>

        <!-- Pedido Concluído -->
        <div v-if="orderSubmitted" class="order-success">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
          </div>
          <h2>Pedido Confirmado!</h2>
          <p class="order-number">Número do pedido: <strong>{{ orderNumber }}</strong></p>
          <p class="success-message">
            Seu pedido foi recebido e está sendo preparado. 
            Tempo estimado de entrega: {{ storeSettings.deliveryMinTime }}-{{ storeSettings.deliveryMaxTime }} minutos.
          </p>
          <button @click="goBackToMenu" class="continue-shopping-btn">
            Continuar Comprando
          </button>
        </div>

        <!-- Formulário de Checkout -->
        <div v-else class="checkout-content">
          <div class="checkout-layout">
            <!-- Itens do Pedido -->
            <div class="order-items-section">
              <div class="section-header">
                <h3>Itens do Pedido</h3>
                <span class="item-count">{{ cart.length }} item(s)</span>
              </div>
              
              <div class="items-list">
                <div v-for="item in cart" :key="item.variantKey" class="cart-item-card">
                  <div class="item-image">
                    <img :src="item.image" :alt="item.name" />
                  </div>
                  <div class="item-details">
                    <h4>{{ item.name }}</h4>
                    <div v-if="item.complements && item.complements.length > 0" class="item-complements">
                      <span v-for="comp in item.complements" :key="comp.name" class="complement">
                        + {{ comp.quantity }}x {{ comp.name }}
                      </span>
                    </div>
                    <div v-if="item.observation" class="item-observation">
                      <small>{{ item.observation }}</small>
                    </div>
                    <div class="item-quantity">Qtd: {{ item.quantity }}</div>
                  </div>
                  <div class="item-price">{{ formatPrice(item.totalPrice) }}</div>
                </div>
              </div>
              
              <div class="order-totals">
                <div class="total-line">
                  <span>Subtotal</span>
                  <span>{{ formatPrice(cartSubtotal) }}</span>
                </div>
                <div v-if="deliveryInfo.zipCode && (isValidatingAddress || (deliveryInfo.canDeliver && deliveryInfo.deliveryFee > 0))" class="total-line">
                  <span>Taxa de Entrega</span>
                  <span v-if="isValidatingAddress" class="calculating-fee">
                    <div class="spinner-small"></div>
                    Calculando...
                  </span>
                  <span v-else>{{ formatPrice(deliveryInfo.deliveryFee) }}</span>
                </div>
                <div class="total-line total">
                  <span>Total</span>
                  <span v-if="isValidatingAddress" class="calculating-total">
                    <div class="spinner-small"></div>
                    Calculando...
                  </span>
                  <span v-else>{{ formatPrice(totalAmount) }}</span>
                </div>
              </div>
            </div>

            <!-- Formulário -->
            <div class="checkout-form">
              <!-- Informações do Cliente -->
              <div v-if="storeSettings.checkoutFields.customerName.enabled || storeSettings.checkoutFields.customerPhone.enabled || storeSettings.checkoutFields.customerEmail.enabled" class="form-section">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Informações Pessoais
                </h3>
                
                <div v-if="storeSettings.checkoutFields.customerName.enabled" class="form-group">
                  <label for="name">Nome Completo {{ storeSettings.checkoutFields.customerName.required ? '*' : '' }}</label>
                  <input
                    id="name"
                    v-model="customerInfo.name"
                    type="text"
                    placeholder="Seu nome completo"
                    :required="storeSettings.checkoutFields.customerName.required"
                  />
                </div>
                
                <div class="form-row">
                  <div v-if="storeSettings.checkoutFields.customerPhone.enabled" class="form-group">
                    <label for="phone">Telefone {{ storeSettings.checkoutFields.customerPhone.required ? '*' : '' }}</label>
                    <input
                      id="phone"
                      v-model="customerInfo.phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      :required="storeSettings.checkoutFields.customerPhone.required"
                    />
                  </div>
                  
                  <div v-if="storeSettings.checkoutFields.customerEmail.enabled" class="form-group">
                    <label for="email">E-mail {{ storeSettings.checkoutFields.customerEmail.required ? '*' : '' }}</label>
                    <input
                      id="email"
                      v-model="customerInfo.email"
                      type="email"
                      placeholder="seu@email.com"
                      :required="storeSettings.checkoutFields.customerEmail.required"
                    />
                  </div>
                </div>
              </div>

              <!-- Endereço de Entrega -->
              <div v-if="storeSettings.checkoutFields.deliveryZipCode.enabled || storeSettings.checkoutFields.deliveryAddress.enabled || storeSettings.checkoutFields.deliveryComplement.enabled || storeSettings.checkoutFields.deliveryNeighborhood.enabled || storeSettings.checkoutFields.deliveryCity.enabled" class="form-section">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Endereço de Entrega
                </h3>
                
                <div v-if="storeSettings.checkoutFields.deliveryZipCode.enabled" class="form-group">
                  <label for="zipCode">CEP {{ storeSettings.checkoutFields.deliveryZipCode.required ? '*' : '' }}</label>
                  <div class="input-wrapper">
                    <input
                      id="zipCode"
                      v-model="deliveryInfo.zipCode"
                      @input="deliveryInfo.zipCode = formatZipCode($event.target.value); validateAddressAutomatically()"
                      type="text"
                      placeholder="00000-000"
                      maxlength="9"
                      :required="storeSettings.checkoutFields.deliveryZipCode.required"
                      :class="{ 
                        'validating': isValidatingAddress,
                        'input-error': addressValidationError,
                        'input-success': deliveryInfo.canDeliver && !addressValidationError && deliveryInfo.deliveryFee > 0
                      }"
                    />
                    <div v-if="isValidatingAddress" class="input-spinner">
                      <div class="spinner-small"></div>
                    </div>
                    <div v-if="deliveryInfo.canDeliver && !addressValidationError && deliveryInfo.deliveryFee > 0 && !isValidatingAddress" class="input-success-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"></path>
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    </div>
                    <div v-if="addressValidationError && !isValidatingAddress" class="input-error-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    </div>
                  </div>
                  <small class="field-hint">Digite o CEP para calcular o frete automaticamente</small>
                  <!-- Mensagem de Erro de Validação -->
                  <div v-if="addressValidationError && !isValidatingAddress" class="input-error-message">
                    {{ addressValidationError }}
                  </div>
                  <!-- Informações de Entrega Validadas -->
                  <div v-if="deliveryInfo.canDeliver && !addressValidationError && deliveryInfo.deliveryFee > 0 && !isValidatingAddress" class="input-success-message">
                    Frete: {{ formatPrice(deliveryInfo.deliveryFee) }}
                  </div>
                </div>
                
                <div v-if="storeSettings.checkoutFields.deliveryAddress.enabled" class="form-group">
                  <label for="address">Endereço {{ storeSettings.checkoutFields.deliveryAddress.required ? '*' : '' }}</label>
                  <input
                    id="address"
                    v-model="deliveryInfo.address"
                    type="text"
                    placeholder="Rua, Avenida, Logradouro"
                    :required="storeSettings.checkoutFields.deliveryAddress.required"
                  />
                </div>
                
                <div class="form-group">
                  <label for="number">Número *</label>
                  <input
                    id="number"
                    v-model="deliveryInfo.number"
                    type="text"
                    placeholder="123"
                    required
                  />
                </div>
                
                <div v-if="storeSettings.checkoutFields.deliveryComplement.enabled" class="form-group">
                  <label for="complement">Complemento {{ storeSettings.checkoutFields.deliveryComplement.required ? '*' : '' }}</label>
                  <input
                    id="complement"
                    v-model="deliveryInfo.complement"
                    type="text"
                    placeholder="Apartamento, Casa, Bloco..."
                    :required="storeSettings.checkoutFields.deliveryComplement.required"
                  />
                </div>
                
                <div class="form-row">
                  <div v-if="storeSettings.checkoutFields.deliveryNeighborhood.enabled" class="form-group">
                    <label for="neighborhood">Bairro {{ storeSettings.checkoutFields.deliveryNeighborhood.required ? '*' : '' }}</label>
                    <input
                      id="neighborhood"
                      v-model="deliveryInfo.neighborhood"
                      type="text"
                      placeholder="Nome do bairro"
                      :required="storeSettings.checkoutFields.deliveryNeighborhood.required"
                    />
                  </div>
                  
                  <div v-if="storeSettings.checkoutFields.deliveryCity.enabled" class="form-group">
                    <label for="city">Cidade {{ storeSettings.checkoutFields.deliveryCity.required ? '*' : '' }}</label>
                    <input
                      id="city"
                      v-model="deliveryInfo.city"
                      type="text"
                      placeholder="Nome da cidade"
                      :required="storeSettings.checkoutFields.deliveryCity.required"
                    />
                  </div>
                </div>
              </div>

              <!-- Forma de Pagamento -->
              <div v-if="storeSettings.checkoutFields.paymentMethod.enabled" class="form-section">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  Forma de Pagamento {{ storeSettings.checkoutFields.paymentMethod.required ? '*' : '' }}
                </h3>
                
                <div class="payment-options">
                  <label class="payment-option">
                    <input
                      v-model="paymentMethod"
                      type="radio"
                      value="pix"
                      name="payment"
                    />
                    <div class="payment-card">
                      <div class="payment-icon">PIX</div>
                      <div class="payment-info">
                        <span class="payment-name">PIX</span>
                        <span class="payment-desc">Pagamento instantâneo</span>
                      </div>
                    </div>
                  </label>
                  
                  <label class="payment-option">
                    <input
                      v-model="paymentMethod"
                      type="radio"
                      value="dinheiro"
                      name="payment"
                    />
                    <div class="payment-card">
                      <div class="payment-icon">💵</div>
                      <div class="payment-info">
                        <span class="payment-name">Dinheiro</span>
                        <span class="payment-desc">Pagamento na entrega</span>
                      </div>
                    </div>
                  </label>
                  
                  <label class="payment-option">
                    <input
                      v-model="paymentMethod"
                      type="radio"
                      value="cartao"
                      name="payment"
                    />
                    <div class="payment-card">
                      <div class="payment-icon">💳</div>
                      <div class="payment-info">
                        <span class="payment-name">Cartão</span>
                        <span class="payment-desc">Crédito/Débito na entrega</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Observações -->
              <div v-if="storeSettings.checkoutFields.notes.enabled" class="form-section">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  Observações {{ storeSettings.checkoutFields.notes.required ? '*' : '' }}
                </h3>
                
                <div class="form-group">
                  <label for="notes">Observações do Pedido</label>
                  <textarea
                    id="notes"
                    v-model="notes"
                    placeholder="Instruções especiais para o pedido..."
                    rows="4"
                    :required="storeSettings.checkoutFields.notes.required"
                  ></textarea>
                </div>
              </div>
              
              <!-- Botão Finalizar -->
              <div class="submit-section">
                <button
                  @click="submitOrder"
                  :disabled="!isFormValid || isSubmitting"
                  class="submit-order-btn"
                >
                  <div v-if="isSubmitting" class="loading-spinner-small"></div>
                  <span v-else class="btn-content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2s-.9-2-2-2m10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2s2-.9 2-2s-.9-2-2-2m-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03L21 4.96L19.25 4l-3.7 7H8.53L4.27 2H1v2h2l3.6 7.59l-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7zM12 2l4 4l-4 4l-1.41-1.41L12.17 7H8V5h4.17l-1.59-1.59z"/>
                    </svg>
                    Finalizar Pedido
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-bottom">
          <p>
            &copy; {{ new Date().getFullYear() }} {{ storeSettings.storeName }}. Desenvolvido
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
  </div>
</template>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background: #f8fafc;
}

/* Loading Screen */
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

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  font-size: 1.125rem;
  color: #666;
  margin: 0;
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

.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem 1rem 0;
  }
}

/* Header */
.checkout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-info .logo {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  object-fit: cover;
}

.header-info h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* Pedido Concluído */
.order-success {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.success-icon {
  color: #10b981;
  margin-bottom: 2rem;
}

.order-success h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.order-number {
  font-size: 1.25rem;
  color: #374151;
  margin: 0 0 1rem 0;
}

.success-message {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.continue-shopping-btn {
  background: #ff8e24;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.continue-shopping-btn:hover {
  background: #e67e22;
}

/* Conteúdo do Checkout */
.checkout-content {
  flex: 1;
}

.checkout-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Seção de Itens do Pedido */
.order-items-section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.items-list {
  margin-bottom: 1.5rem;
}

.cart-item-card {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.cart-item-card:last-child {
  border-bottom: none;
}

.cart-item-card .item-image {
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
}

.cart-item-card .item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-card .item-details {
  flex: 1;
  min-width: 0;
}

.cart-item-card .item-details h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  overflow-wrap: break-word;
}

.order-totals {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
}

.submit-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
}

/* Formulário */
.checkout-form {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f3f4f6;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
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
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: white;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #ff8e24;
  box-shadow: 0 0 0 3px rgba(255, 142, 36, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

/* Wrapper para inputs com validação */
.input-wrapper {
  position: relative;
}

.input-wrapper input.validating {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  padding-right: 2.5rem;
}

.input-wrapper input.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  padding-right: 2.5rem;
}

.input-wrapper input.input-success {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  padding-right: 2.5rem;
}

.input-spinner,
.input-success-icon,
.input-error-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-success-icon {
  color: #10b981;
}

.input-error-icon {
  color: #ef4444;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.field-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

.input-error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #991b1b;
  font-size: 0.875rem;
  font-weight: 500;
}

.input-success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  color: #166534;
  font-size: 0.875rem;
  font-weight: 500;
}

.delivery-details {
  flex: 1;
}

.delivery-details p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.delivery-details strong {
  font-weight: 600;
}

.delivery-note {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(34, 197, 94, 0.2);
}

.delivery-note small {
  color: #059669;
  font-style: italic;
}

/* Opções de Pagamento */
.payment-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-option {
  cursor: pointer;
}

.payment-option input[type="radio"] {
  display: none;
}

.payment-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  transition: all 0.2s;
  background: white;
}

.payment-option input[type="radio"]:checked + .payment-card {
  border-color: #ff8e24;
  background: #fff7ed;
}

.payment-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.payment-name {
  font-weight: 600;
  color: #1f2937;
}

.payment-desc {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Resumo do Pedido */
.order-summary {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 2rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.summary-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.item-count {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.summary-items {
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.summary-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-details h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  overflow-wrap: break-word;
}

.item-complements {
  margin-bottom: 0.5rem;
}

.complement {
  display: inline-block;
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  margin-right: 0.25rem;
  margin-bottom: 0.125rem;
}

.item-observation {
  margin-bottom: 0.5rem;
}

.item-observation small {
  color: #6b7280;
  font-style: italic;
  font-size: 0.75rem;
}

.item-quantity {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.item-price {
  font-weight: 600;
  color: #ff8e24;
  font-size: 1rem;
  white-space: nowrap;
}

.summary-totals {
  margin-bottom: 2rem;
}

.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.total-line.total {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  border-top: 2px solid #f3f4f6;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
}

.calculating-fee,
.calculating-total {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-style: italic;
}

.calculating-fee .spinner-small,
.calculating-total .spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #6b7280;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.submit-order-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #ff8e24;
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: center;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-order-btn:hover:not(:disabled) {
  background: #e67e22;
}

.submit-order-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Footer */
.footer {
  width: 100%;
  padding: 2rem 0 1.5rem;
  color: #666;
  font-size: 0.875rem;
  margin-top: auto;
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

/* Responsive */
@media (max-width: 768px) {
  .checkout-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .header-info h1 {
    font-size: 1.25rem;
  }
  
  .checkout-form {
    padding: 1.5rem;
  }
  
  .order-items-section {
    padding: 1.5rem;
  }
  
  .cart-item-card {
    gap: 0.75rem;
  }
  
  .cart-item-card .item-image {
    width: 60px;
    height: 60px;
  }
  
  .form-section h3 {
    font-size: 1.125rem;
  }
  
  .summary-header h3 {
    font-size: 1.125rem;
  }
  
  .submit-order-btn {
    padding: 0.875rem 1.25rem;
    font-size: 1rem;
    gap: 0.4rem;
  }
  
  .btn-content {
    gap: 0.4rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0.5rem 0.5rem 0;
  }
  
  .checkout-form {
    padding: 1rem;
  }
  
  .order-summary {
    padding: 1rem;
  }
  
  .form-section h3 {
    font-size: 1rem;
  }
  
  .summary-header h3 {
    font-size: 1rem;
  }
  
  .payment-card {
    padding: 0.75rem;
  }
  
  .payment-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .summary-item {
    gap: 0.75rem;
  }
  
  .item-image {
    width: 50px;
    height: 50px;
  }
  
  .item-details h4 {
    font-size: 0.875rem;
  }
  
  .item-price {
    font-size: 0.875rem;
  }
  
  .total-line {
    font-size: 0.875rem;
  }
  
  .total-line.total {
    font-size: 1.125rem;
  }
}
</style>
