<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h1>Connexion</h1>
        <p v-if="error" class="error">{{ error }}</p>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>Email</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="votre@email.fr"
            />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <div class="divider">
          <span>ou</span>
        </div>

        <h2>Créer un compte</h2>
        <form @submit.prevent="handleSignup">
          <div class="form-group">
            <label>Prénom</label>
            <input v-model="signupFirstName" type="text" required />
          </div>
          <div class="form-group">
            <label>Nom</label>
            <input v-model="signupLastName" type="text" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="signupEmail" type="email" required />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input v-model="signupPassword" type="password" required minlength="6" />
          </div>
          <div class="form-group">
            <label>Poste (optionnel)</label>
            <input v-model="signupJobTitle" type="text" />
          </div>
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? 'Création...' : 'Créer un compte' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ params: any; query: any }>()
import { ref, inject } from 'vue'

const router = inject('router') as any

const email = ref('')
const password = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const signupFirstName = ref('')
const signupLastName = ref('')
const signupJobTitle = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.error || 'Erreur de connexion'
      return
    }

    // Debug: Log consultant data
    console.log('Login successful, full response:', data)
    console.log('Consultant data:', data.consultant)
    console.log('Roles in response:', data.consultant?.roles)
    
    // Verify roles are present
    if (!data.consultant?.roles || data.consultant.roles.length === 0) {
      console.error('⚠️ WARNING: No roles returned from server!')
      console.error('This should not happen. Check server logs.')
    }

    // Store token
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('consultant', JSON.stringify(data.consultant))
    
    // Verify roles are stored
    const storedConsultant = JSON.parse(localStorage.getItem('consultant') || '{}')
    console.log('Stored consultant in localStorage:', storedConsultant)
    console.log('Stored roles in localStorage:', storedConsultant?.roles)

    // Redirect to dashboard
    router.push('/admin/dashboard')
  } catch (err) {
    error.value = 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}

async function handleSignup() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupEmail.value,
        password: signupPassword.value,
        firstName: signupFirstName.value,
        lastName: signupLastName.value,
        jobTitle: signupJobTitle.value || null
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.error || 'Erreur lors de la création du compte'
      return
    }

    // Store token
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('consultant', JSON.stringify(data.consultant))

    // Redirect to dashboard
    router.push('/admin/dashboard')
  } catch (err) {
    error.value = 'Erreur lors de la création du compte'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  @include flex-center;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  padding: $spacing-lg;
  position: relative;
  overflow: hidden;
  
  // Decorative elements inspired by Images & Réseaux
  &::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
    border-radius: 50%;
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -80px;
    left: -80px;
    width: 250px;
    height: 250px;
    background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%);
    border-radius: 50%;
    z-index: 0;
  }
}

.auth-container {
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 1;
}

.auth-card {
  @include card;
  padding: $spacing-2xl;
  background: white;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  border-radius: $radius-xl;
  position: relative;
  overflow: hidden;
  
  // Subtle decorative accent
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, $primary 0%, rgba(147, 51, 234, 0.8) 100%);
  }

  h1, h2 {
    text-align: center;
    margin-bottom: $spacing-lg;
    color: $gray-900;
  }
  
  h1 {
    font-size: $font-size-3xl;
    background: linear-gradient(135deg, $primary 0%, rgba(147, 51, 234, 1) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }

  h2 {
    margin-top: $spacing-xl;
    font-size: $font-size-xl;
    color: $gray-700;
  }
}

.form-group {
  margin-bottom: $spacing-lg;
  position: relative;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 600;
    color: $gray-700;
    font-size: $font-size-sm;
  }

  input {
    @include input;
    transition: all 0.3s ease;
    border: 2px solid $gray-300;
    
    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      outline: none;
    }
    
    &:hover {
      border-color: $gray-400;
    }
  }
}

.error {
  background: rgba(230, 0, 18, 0.1); // Rouge Images & Réseaux avec transparence
  color: $danger;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
  text-align: center;
  border: 1px solid rgba(230, 0, 18, 0.2);
}

.divider {
  text-align: center;
  margin: $spacing-xl 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: $gray-300;
  }

  span {
    background: white;
    padding: 0 $spacing-md;
    position: relative;
    color: $gray-500;
  }
}

.btn-primary {
  @include button-primary;
  width: 100%;
  margin-top: $spacing-md;
  padding: $spacing-md $spacing-lg;
  font-weight: 600;
  font-size: $font-size-base;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 102, 204, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}
</style>

