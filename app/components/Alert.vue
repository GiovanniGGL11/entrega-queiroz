<template>
  <Teleport to="body">
    <Transition name="alert-slide">
      <div v-if="show" class="alert-toast" :class="type">
        <div class="alert-icon">
          <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
          </svg>
          <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg v-else-if="type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <div v-if="title" class="alert-title">{{ title }}</div>
          <div class="alert-message">{{ message }}</div>
        </div>
        <button @click="$emit('close')" class="alert-close">×</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: { type: String, default: '' },
  message: { type: String, required: true }
})

defineEmits(['close'])
</script>

<style scoped>
.alert-toast {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 99999;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  min-width: 260px;
  max-width: 380px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
  font-size: 0.9375rem;
  pointer-events: all;
}

.alert-toast.success {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
}

.alert-toast.error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.alert-toast.warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
}

.alert-toast.info {
  background: #eff6ff;
  border: 1px solid #93c5fd;
  color: #1e40af;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.alert-message {
  line-height: 1.4;
}

.alert-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  padding: 0;
  flex-shrink: 0;
  align-self: flex-start;
}

.alert-close:hover {
  opacity: 1;
}

/* Transition */
.alert-slide-enter-active,
.alert-slide-leave-active {
  transition: all 0.25s ease;
}

.alert-slide-enter-from,
.alert-slide-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

@media (max-width: 480px) {
  .alert-toast {
    top: auto;
    bottom: 1.25rem;
    right: 0.75rem;
    left: 0.75rem;
    max-width: none;
    min-width: 0;
  }

  .alert-slide-enter-from,
  .alert-slide-leave-to {
    opacity: 0;
    transform: translateY(1rem);
  }
}
</style>
