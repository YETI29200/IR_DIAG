<template>
  <button 
    @click="handleBack" 
    class="btn-back"
    :class="customClass"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>{{ label || 'Retour' }}</span>
  </button>
</template>

<script setup lang="ts">
import { inject } from 'vue'

interface Props {
  label?: string
  to?: string
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Retour',
  to: undefined,
  customClass: ''
})

const router = inject('router') as any

function handleBack() {
  if (props.to) {
    router.push(props.to)
    return
  }

  // Si on a un historique, on l'utilise
  if (window.history.length > 1) {
    window.history.back()
  } else {
    // Sinon on retourne à l'accueil par défaut
    router.push('/')
  }
}
</script>

<style scoped lang="scss">
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #FFDC00;
    border-color: #FFDC00;
    color: #111827;
    transform: translateX(-4px);
    box-shadow: 0 4px 12px rgba(255, 220, 0, 0.3);
  }

  svg {
    flex-shrink: 0;
  }

  span {
    white-space: nowrap;
  }
}
</style>

