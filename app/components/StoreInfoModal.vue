<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="close">
        <div class="modal-card" @click.stop>
          <div class="scrollable-content">
            <div class="image-container">
              <div class="modal-image">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <button class="close-btn" @click="close" aria-label="Fechar">
                ×
              </button>
            </div>

            <div class="modal-body">
              <div class="modal-content">
                <h4>{{ storeSettings.storeName || 'Informações do Delivery' }}</h4>
                <p>Confira todas as informações sobre nosso serviço de delivery</p>
              </div>
            <!-- Horários de Funcionamento -->
            <div class="info-section">
              <div class="section-header">
                <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <h3>Horários de Funcionamento</h3>
              </div>
              <div class="section-content">
                <div class="time-info">
                  <span class="status-badge" :class="storeSettings.isOpen ? 'open' : 'closed'">
                    {{ storeSettings.isOpen ? 'Aberto agora' : 'Fechado agora' }}
                  </span>
                </div>
                <div class="schedule-list">
                  <div class="schedule-row">
                    <span class="schedule-days">Quarta a Domingo</span>
                    <span class="schedule-hours">18h30 – 23h30</span>
                  </div>
                  <div class="schedule-row closed-day">
                    <span class="schedule-days">Segunda e Terça</span>
                    <span class="schedule-hours">Fechado</span>
                  </div>
                </div>
                <p class="time-text" style="margin-top: 0.75rem;">
                  <strong>Tempo de entrega:</strong> {{ storeSettings.deliveryMinTime }}-{{ storeSettings.deliveryMaxTime }} minutos
                </p>
              </div>
            </div>

            <!-- Informações de Entrega -->
            <div class="info-section">
              <div class="section-header">
                <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <h3>Informações de Entrega</h3>
              </div>
              <div class="section-content">
                <div class="delivery-info">
                  <div class="info-item" v-if="storeSettings.minimumOrder > 0">
                    <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <span><strong>Pedido mínimo:</strong> R$ {{ storeSettings.minimumOrder.toFixed(2) }}</span>
                  </div>
                  
                  <div class="info-item" v-if="storeSettings.deliveryFee > 0">
                    <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.65 1.65 0 0 1-1-2v-6a2 2 0 0 1 2-2h2"/>
                    </svg>
                    <span><strong>Taxa de entrega:</strong> R$ {{ storeSettings.deliveryFee.toFixed(2) }}</span>
                  </div>
                  
                  <div class="info-item" v-else>
                    <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.65 1.65 0 0 1-1-2v-6a2 2 0 0 1 2-2h2"/>
                    </svg>
                    <span><strong>Entrega gratuita</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mapa de Localização -->
            <div class="info-section">
              <div class="section-header">
                <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <h3>Nossa Localização</h3>
              </div>
              <div class="section-content">
                <div class="map-container">
                  <div id="store-map" class="map"></div>
                  <div class="map-info">
                    <p><strong>Endereço:</strong> {{ storeSettings.storeAddress || 'Endereço não informado' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Formas de Pagamento -->
            <div class="info-section">
              <div class="section-header">
                <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                <h3>Formas de Pagamento</h3>
              </div>
              <div class="section-content">
                <div class="payment-methods">
                  <div class="payment-item">
                    <svg class="payment-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                    <span>Dinheiro</span>
                  </div>
                  <div class="payment-item">
                    <svg class="payment-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <span>Cartão</span>
                  </div>
                  <div class="payment-item">
                    <svg class="payment-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    <span>PIX</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- WhatsApp -->
            <div class="info-section">
              <div class="section-header">
                <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <h3>WhatsApp</h3>
              </div>
              <div class="section-content">
                <div class="contact-info">
                  <div class="contact-item">
                    <svg class="contact-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    <a href="https://wa.me/5511980554271" target="_blank" rel="noopener noreferrer">
                      +55 11 98055-4271
                    </a>
                  </div>
                  <div class="contact-item">
                    <svg class="contact-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                    </svg>
                    <a href="https://www.instagram.com/queirozhamburgueria7?igsh=MWFxZWpyYmNjdnp6Zg==" target="_blank" rel="noopener noreferrer">
                      @queirozhamburgueria7
                    </a>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  storeSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

let map = null

const close = () => {
  emit('close')
}

const initMap = () => {
  if (typeof window === 'undefined' || !window.L) return
  
  // Coordenadas do estabelecimento - pode ser configurado nas settings
  const storeLat = props.storeSettings.storeLatitude || -23.5505
  const storeLng = props.storeSettings.storeLongitude || -46.6333
  
  map = window.L.map('store-map').setView([storeLat, storeLng], 15)
  
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)
  
  // Adicionar marcador da loja
  window.L.marker([storeLat, storeLng])
    .addTo(map)
    .bindPopup(`${props.storeSettings.storeName || 'Nossa Loja'}`)
    .openPopup()
}

const destroyMap = () => {
  if (map) {
    map.remove()
    map = null
  }
}

onMounted(() => {
  if (props.show) {
    nextTick(() => {
      // Aguardar um pouco para garantir que o DOM está renderizado
      setTimeout(() => {
        initMap()
      }, 100)
    })
  }
})

onUnmounted(() => {
  destroyMap()
})

// Watch para mostrar/esconder o mapa
watch(() => props.show, (newShow) => {
  if (newShow) {
    nextTick(() => {
      setTimeout(() => {
        initMap()
      }, 100)
    })
  } else {
    destroyMap()
  }
})
</script>

<style scoped>
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
  border-top-left-radius: 1rem;
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
  overflow: hidden;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.image-container {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #ff8e24 0%, #e67e22 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image {
  color: #fff;
  opacity: 0.9;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.modal-body {
  padding: 1.5rem;
}

.modal-content {
  margin-bottom: 1.5rem;
}

.modal-content h4 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.modal-content p {
  color: #666;
  margin: 0;
  font-size: 0.95rem;
}

.info-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.section-icon {
  color: #ff8e24;
  flex-shrink: 0;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.section-content {
  color: #555;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.open {
  background: #d4edda;
  color: #155724;
}

.status-badge.closed {
  background: #f8d7da;
  color: #721c24;
}

.time-text {
  margin: 0;
  font-size: 0.95rem;
}

.delivery-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.info-icon {
  color: #ff8e24;
  flex-shrink: 0;
}

.map-container {
  margin-top: 0.5rem;
}

.map {
  width: 100%;
  height: 200px;
  border-radius: 0.5rem;
  border: 1px solid #e0e0e0;
}

.map-info {
  margin-top: 0.75rem;
  font-size: 0.9rem;
}

.map-info p {
  margin: 0.25rem 0;
}

.payment-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.payment-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fff;
  border-radius: 0.5rem;
  border: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.payment-icon {
  color: #ff8e24;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.contact-icon {
  color: #ff8e24;
  flex-shrink: 0;
}

.contact-item a {
  color: #ff8e24;
  text-decoration: none;
}

.contact-item a:hover {
  text-decoration: underline;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.schedule-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid #eee;
}

.schedule-row:last-child {
  border-bottom: none;
}

.schedule-days {
  color: #333;
  font-weight: 500;
}

.schedule-hours {
  color: #333;
  font-weight: 600;
}

.closed-day .schedule-days,
.closed-day .schedule-hours {
  color: #999;
  font-weight: 400;
}

/* Transições */
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

/* Responsividade */
@media (max-width: 768px) {
  .modal-card {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }

  .image-container {
    height: 150px;
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

  .info-section {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  .section-header h3 {
    font-size: 1rem;
  }

  .time-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .payment-methods {
    flex-direction: column;
  }

  .payment-item {
    justify-content: center;
  }
}
</style>
