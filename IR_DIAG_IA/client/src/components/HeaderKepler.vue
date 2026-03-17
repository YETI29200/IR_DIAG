<template>
  <header class="kepler-header">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="container container-flex py-1.5">
        <div class="top-bar-info">
          <span>📍 Espace Corinne Erhel, 4 Rue Louis de Broglie, 22300 Lannion</span>
          <span class="divider">|</span>
          <span>📞 02 96 48 31 55</span>
        </div>
        <div class="top-bar-links">
          <a href="mailto:contact@images-et-reseaux.com" class="top-link">Contact</a>
          <span class="divider">|</span>
          <a href="#" class="top-link">EN | FR</a>
        </div>
      </div>
    </div>
    
    <!-- Main Header -->
    <div class="main-header">
      <div class="container container-flex py-3">
        <router-link to="/" class="logo-link">
          <img src="/logo.png" alt="Images & Réseaux Logo" class="logo-image" />
        </router-link>
        
        <nav class="header-nav">
          <router-link to="/" class="nav-item">Accueil</router-link>
          
          <!-- App Specific Links -->
          <router-link v-if="isAuthenticated" to="/admin/dashboard" class="nav-item">📋 Gestion des projets</router-link>
          <router-link v-if="isAuthenticated" to="/admin/consolidated" class="nav-item">📊 Vue Consolidée</router-link>
          
          <router-link v-if="!isAuthenticated" to="/auth" class="nav-item">Se connecter</router-link>
          
          <div v-if="isAuthenticated" class="user-actions">
            <span class="user-welcome">Bonjour, {{ userName }}</span>
            <button @click="logout" class="btn-logout">Déconnexion</button>
            <router-link to="/admin/dashboard" class="pill-button-cyan scale-90 btn-space">Espace Admin</router-link>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { inject } from 'vue'

const router = inject('router') as any

const isAuthenticated = ref(false)
const userName = ref('')

const checkAuth = () => {
  const token = localStorage.getItem('auth_token')
  const consultant = JSON.parse(localStorage.getItem('consultant') || '{}')
  isAuthenticated.value = !!token
  userName.value = consultant.firstName || ''
}

onMounted(checkAuth)

// Watch for route changes to refresh auth state
// (Router is injected, we can watch its current path if it's a ref)
if (router && router.getCurrentPath) {
  watch(router.getCurrentPath(), checkAuth)
}

const logout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('consultant')
  isAuthenticated.value = false
  router.push('/auth')
}
</script>

<style scoped lang="scss">
.kepler-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.top-bar {
  background-color: #111827;
  color: white;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.top-bar-links {
  margin-left: auto;
  display: flex;
  gap: 1rem;
}

.top-link {
  color: white;
  text-decoration: none;
  &:hover {
    color: #00B1E6;
  }
}

.divider {
  color: #374151;
}

.main-header {
  background-color: #FFDC00;
  border-bottom: 1px solid #facc15;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

.container-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }

.logo-image {
  height: 3.5rem;
  width: auto;
  object-fit: contain;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.85rem;
  color: #111827;
  font-family: 'Oswald', sans-serif;
}

.nav-item {
  color: inherit;
  text-decoration: none;
  transition: all 0.2s;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  
  &:hover {
    color: white;
  }
  
  &.router-link-active {
    border-bottom-color: white;
    color: white;
  }
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

.user-welcome {
  font-size: 0.75rem;
  color: #4b5563;
  text-transform: none;
}

.btn-logout {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  color: #ef4444;
  &:hover {
    text-decoration: underline;
  }
}

.btn-space {
  margin-left: 0.5rem;
}

@media (max-width: 1024px) {
  .header-nav {
    gap: 1rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }
}
</style>
