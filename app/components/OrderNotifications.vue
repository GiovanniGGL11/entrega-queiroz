<template>
  <div class="notifications-container">
    <!-- Badge de notificação no canto -->
    <div 
      v-if="notifications.length > 0" 
      class="notification-badge"
      @click="togglePanel"
      :class="{ 'has-new': hasUnread }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span v-if="notifications.length > 0" class="badge-count">{{ notifications.length }}</span>
    </div>

    <!-- Painel de notificações -->
    <Transition name="slide-down">
      <div v-if="showPanel" class="notifications-panel">
        <div class="panel-header">
          <h3>Pedidos Recentes</h3>
          <button @click="clearAll" class="btn-clear" v-if="notifications.length > 0">
            Limpar tudo
          </button>
          <button @click="togglePanel" class="btn-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="notifications-list">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read }"
            @click="markAsRead(notification); viewOrder(notification.order)"
          >
            <div class="notification-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
            </div>
            <div class="notification-content">
              <div class="notification-title">
                Pedido #{{ notification.order.orderNumber }}
              </div>
              <div class="notification-details">
                <span class="customer-name">{{ notification.order.customerInfo?.name || 'Cliente' }}</span>
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              <div class="notification-total">
                {{ formatCurrency(notification.order.totalAmount) }}
              </div>
            </div>
            <div v-if="!notification.read" class="unread-indicator"></div>
          </div>
          
          <div v-if="notifications.length === 0" class="empty-notifications">
            <p>Nenhuma notificação</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Overlay para fechar painel -->
    <div 
      v-if="showPanel" 
      class="notifications-overlay" 
      @click="togglePanel"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  notifications: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['view-order', 'mark-read', 'clear-all'])

const showPanel = ref(false)
const hasUnread = computed(() => props.notifications.some(n => !n.read))

const togglePanel = () => {
  showPanel.value = !showPanel.value
}

const viewOrder = (order) => {
  emit('view-order', order)
  togglePanel()
}

const markAsRead = (notification) => {
  emit('mark-read', notification)
}

const clearAll = () => {
  emit('clear-all')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatTime = (date) => {
  const now = new Date()
  const notificationDate = new Date(date)
  const diffMs = now - notificationDate
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Agora'
  if (diffMins === 1) return 'Há 1 minuto'
  if (diffMins < 60) return `Há ${diffMins} minutos`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return 'Há 1 hora'
  if (diffHours < 24) return `Há ${diffHours} horas`
  
  return notificationDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 80px;
  right: 2rem;
  z-index: 1000;
}

.notification-badge {
  position: relative;
  width: 48px;
  height: 48px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-badge:hover {
  background: #f3f4f6;
  border-color: #FF6B35;
  transform: scale(1.05);
}

.notification-badge.has-new {
  animation: pulse 2s infinite;
  border-color: #FF6B35;
  background: linear-gradient(135deg, #FF6B35 0%, #ff8e24 100%);
  color: white;
}

.notification-badge svg {
  width: 20px;
  height: 20px;
}

.badge-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border: 2px solid white;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
  }
  50% {
    box-shadow: 0 2px 16px rgba(255, 107, 53, 0.6);
  }
}

.notifications-panel {
  position: absolute;
  top: 60px;
  right: 0;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.btn-clear, .btn-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-clear:hover, .btn-close:hover {
  background: #e5e7eb;
  color: #1e293b;
}

.btn-clear {
  font-size: 0.875rem;
  margin-right: 0.5rem;
}

.notifications-list {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
}

.notification-item {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #fffbeb;
  border-left: 3px solid #ff8e24;
}

.notification-icon {
  width: 36px;
  height: 36px;
  background: #ff8e24;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
}

.notification-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

.customer-name {
  font-weight: 500;
  color: #475569;
}

.notification-time {
  color: #94a3b8;
  font-size: 0.7rem;
}

.notification-total {
  font-weight: 700;
  color: #ff8e24;
  font-size: 0.875rem;
}

.unread-indicator {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  width: 8px;
  height: 8px;
  background: #FF6B35;
  border-radius: 50%;
}

.empty-notifications {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
}

.notifications-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
}

/* Transições */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .notifications-container {
    top: 70px;
    right: 1rem;
  }
  
  .notifications-panel {
    width: calc(100vw - 2rem);
    max-width: 400px;
  }
}
</style>




