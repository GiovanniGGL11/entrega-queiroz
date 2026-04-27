<template>
  <Teleport to="body">
    <Transition name="image-overlay-fade">
      <div
        v-if="show"
        class="image-overlay"
        @click="onClose"
      >
        <button
          class="image-close-btn"
          @click="onClose"
          aria-label="Fechar"
        >
          ×
        </button>
        <div class="image-overlay-content" @click.stop>
          <img
            :src="imageUrl"
            :alt="alt || 'Imagem expandida'"
            class="overlay-image"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const onClose = () => {
  emit('close')
}
</script>

<style scoped>
.image-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  padding: 2rem;
}

.image-overlay-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-image {
  max-width: 90vw;
  max-height: 85vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.image-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0,0,0,0.4);
  border: none;
  border-radius: 50%;
  font-size: 2rem;
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  width: 44px;
  height: 44px;
  line-height: 1;
  padding: 0;
}

/* Transitions */
.image-overlay-fade-enter-active,
.image-overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.image-overlay-fade-enter-from,
.image-overlay-fade-leave-to {
  opacity: 0;
}

.image-overlay-fade-enter-active .overlay-image,
.image-overlay-fade-leave-active .overlay-image {
  transition: transform 0.3s ease;
}

.image-overlay-fade-enter-from .overlay-image,
.image-overlay-fade-leave-to .overlay-image {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .image-overlay {
    padding: 0.75rem;
    padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  }

  .overlay-image {
    max-height: 80dvh;
  }
}
</style>

