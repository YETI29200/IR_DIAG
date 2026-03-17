<template>
  <div class="questionnaire">
    <!-- Old header hidden via CSS -->
    <div class="page-navigation container">
      <div class="nav-top">
        <BackButton :to="params.missionId ? `/admin/dashboard` : '/'" />
      </div>
      
      <div class="page-title-section">
        <h1 class="page-title">{{ mission?.organizationName || 'Questionnaire' }}</h1>
        <p class="mission-subtitle" v-if="service">{{ service.name }}</p>
      </div>
    </div>

    <main class="main">
      <div class="container">
        <div v-if="loading" class="loading">Chargement du questionnaire...</div>
        <div v-else-if="error" class="error">{{ error }}</div>

        <!-- Page RGPD anonymat (full uniquement, avant le questionnaire) -->
        <div v-else-if="isFullType && showRgpdStep" class="rgpd-card">
          <div class="rgpd-icon">🔒</div>
          <h2>Confidentialité & RGPD</h2>
          <p>Dans le cadre de ce diagnostic de maturité IA, vos réponses serviront au calcul des résultats
          collectifs de votre organisation.</p>
          <p>Vous avez le choix de participer de façon <strong>nominative</strong> ou <strong>anonyme</strong>.</p>

          <div class="rgpd-options">
            <label :class="['rgpd-option', { selected: anonymousChoice === false }]">
              <input type="radio" v-model="anonymousChoice" :value="false" />
              <div class="rgpd-option-content">
                <div class="rgpd-option-icon">👤</div>
                <strong>Participer avec mon identité</strong>
                <span>Le chef de projet pourra voir votre nom associé à la participation (pas à vos réponses individuelles).</span>
              </div>
            </label>
            <label :class="['rgpd-option', { selected: anonymousChoice === true }]">
              <input type="radio" v-model="anonymousChoice" :value="true" />
              <div class="rgpd-option-content">
                <div class="rgpd-option-icon">🕶️</div>
                <strong>Participer de façon anonyme</strong>
                <span>Votre participation est comptabilisée mais votre identité ne sera pas associée à vos réponses.</span>
              </div>
            </label>
          </div>

          <p class="rgpd-consent">
            ✅ En continuant, vous acceptez que vos réponses (anonymisées si vous l'avez choisi) contribuent
            au calcul du profil de maturité collectif de votre organisation.
          </p>

          <div class="actions">
            <button
              @click="startQuestionnaire"
              :disabled="anonymousChoice === null"
              class="btn-primary"
            >
              Continuer vers le questionnaire
            </button>
          </div>
        </div>

        <!-- Questionnaire -->
        <div v-else-if="!completed" class="questionnaire-content">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
            <span class="progress-text">{{ answeredCount }} / {{ questions.length }} questions répondues</span>
          </div>

          <div class="questions">
            <div
              v-for="(question, index) in questions"
              :key="question.id"
              class="question-card"
            >
              <div class="question-header">
                <span class="question-number">Question {{ index + 1 }}</span>
                <span class="dimension-badge">{{ question.dimensionTitle || question.dimension }}</span>
              </div>
              <p class="question-text">{{ question.text }}</p>
              <div class="answer-options">
                <label
                  v-for="(label, index) in scaleLabels"
                  :key="index"
                  :class="['option', { selected: responses[question.id] === index }]"
                >
                  <input
                    type="radio"
                    :name="question.id"
                    :value="index"
                    :checked="responses[question.id] === index"
                    @change="saveAnswer(question.id, question.dimension, index)"
                  />
                  <span>{{ label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="actions">
            <button @click="completeQuestionnaire" :disabled="!allAnswered || submitting" class="btn-primary">
              <span v-if="submitting" class="spinner-wrapper">
                <svg class="spinner" viewBox="0 0 50 50">
                  <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                </svg>
                Envoi en cours...
              </span>
              <span v-else>Finaliser le questionnaire</span>
            </button>
          </div>
        </div>

        <!-- Page remerciement (full uniquement) -->
        <div v-else-if="isFullType && completed" class="thank-you-card">
          <div class="thank-you-icon">✅</div>
          <h2>Merci pour votre participation !</h2>
          <p>Vos réponses ont bien été enregistrées{{ anonymousChoice ? ' de façon anonyme' : '' }}.</p>
          <div class="thank-you-box">
            <p>
              Le chef de projet de votre organisation analysera l'ensemble des résultats et reviendra vers vous
              pour une <strong>présentation collective des résultats</strong>.
            </p>
            <p>Vous n'avez rien d'autre à faire.</p>
          </div>
          <p class="thank-you-footer">Nos équipes restent à votre disposition si vous avez des questions.</p>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ params: any; query: any }>()
import { ref, computed, onMounted, inject } from 'vue'
import BackButton from '../components/BackButton.vue'

const router = inject('router') as any
const params = router.getParams()
const query = router.getQuery()

const mission = ref<any>(null)
const service = ref<any>(null)
const session = ref<any>(null)
const questions = ref<any[]>([])
const scaleLabels = ref<string[]>([])
const responses = ref<Record<string, number>>({})
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const completed = ref(false)

// RGPD / Anonymat (uniquement pour le type 'full')
const showRgpdStep = ref(true)
const anonymousChoice = ref<boolean | null>(null)

const isFullType = computed(() => {
  const type = params.type || (query.mission ? 'full' : '')
  return type === 'full'
})

const answeredCount = computed(() => 
  Object.keys(responses.value).filter(key => responses.value[key] !== undefined).length
)

const progressPercent = computed(() => 
  questions.value.length > 0 ? (answeredCount.value / questions.value.length) * 100 : 0
)

const allAnswered = computed(() => 
  questions.value.every(q => responses.value[q.id] !== undefined)
)

onMounted(async () => {
  await loadQuestionnaire()
  
  // Autosave every 5 seconds
  setInterval(autosave, 5000)
})

async function loadQuestionnaire() {
  loading.value = true
  error.value = ''

  try {
    let type = params.type
    let missionId = params.missionId
    
    if (!type && query.mission) {
      type = 'full'
      missionId = query.mission
    }
    
    const serviceCode = query.service
    const token = query.token

    if (!type || !missionId) {
      throw new Error('Type de questionnaire et ID de mission requis')
    }

    let url = `/api/questionnaire/${type}/${missionId}`
    if (serviceCode) url += `?service=${serviceCode}`
    if (token) url += `${serviceCode ? '&' : '?'}token=${token}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur lors du chargement' }))
      throw new Error(errorData.message || errorData.error || 'Erreur lors du chargement')
    }

        const data = await response.json()
        mission.value = data.mission
        service.value = data.service
        session.value = data.session
        questions.value = data.questions
        scaleLabels.value = data.scaleLabels || []
        responses.value = data.responses || {}

    // Update URL with token for resumability
    if (session.value && !token) {
      router.replace(`${window.location.pathname}?service=${serviceCode || ''}&token=${session.value.token}`)
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function startQuestionnaire() {
  showRgpdStep.value = false
}

async function saveAnswer(questionId: string, dimension: string, value: number) {
  responses.value[questionId] = value

  try {
    await fetch('/api/questionnaire/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.value.id,
        questionId,
        dimension,
        answerValue: value
      })
    })
  } catch (err) {
    console.error('Error saving answer:', err)
  }
}

async function autosave() {
  // Autosave is handled by saveAnswer on each change
}

async function completeQuestionnaire() {
  if (!allAnswered.value) {
    alert('Veuillez répondre à toutes les questions')
    return
  }

  submitting.value = true

  try {
    const response = await fetch('/api/questionnaire/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.value.id,
        isAnonymous: anonymousChoice.value === true ? 1 : 0
      })
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la finalisation')
    }

    if (isFullType.value) {
      // Pour le Maturity Assessment : afficher la page de remerciement
      completed.value = true
    } else {
      // Pour le Flash Diag : rediriger vers les résultats (comportement inchangé)
      router.push(`/results?session=${session.value.id}&mission=${mission.value.id}`)
    }
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la finalisation')
  } finally {
    submitting.value = false
  }
}

// Answer labels are now loaded from JSON (scaleLabels)
</script>

<style lang="scss" scoped>
.questionnaire {
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  position: relative;
  
  // Decorative elements
  &::before {
    content: '';
    position: fixed;
    top: 10%;
    right: -50px;
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0.03) 100%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: fixed;
    bottom: 10%;
    left: -50px;
    width: 150px;
    height: 150px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
  }
}

.header {
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: $spacing-xl 0;
  margin-bottom: $spacing-xl;
  position: relative;
  z-index: 1;
  border-bottom: 3px solid $primary;

  .container {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  .header-content {
    text-align: center;
  }

  h1 {
    margin-bottom: $spacing-sm;
    font-size: $font-size-2xl;
    color: $gray-900;
    font-weight: 700;
  }

  .service-name {
    color: $primary;
    font-size: $font-size-lg;
    font-weight: 600;
    margin-top: $spacing-xs;
  }
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 $spacing-lg;
}

/* ========================
   RGPD CARD
======================== */
.rgpd-card {
  background: white;
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  text-align: center;
  margin-top: $spacing-xl;

  .rgpd-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
    color: #111827;
  }

  p {
    color: #6b7280;
    line-height: 1.7;
    margin-bottom: 1rem;
  }

  .rgpd-consent {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.75rem;
    padding: 1rem;
    font-size: 0.875rem;
    color: #15803d;
    text-align: left;
    margin: 1.5rem 0;
  }
}

.rgpd-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
  text-align: left;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.rgpd-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.25s ease;

  input[type="radio"] {
    display: none;
  }

  &:hover {
    border-color: $primary;
    background: rgba(0,177,230,0.04);
  }

  &.selected {
    border-color: $primary;
    background: rgba(0,177,230,0.08);

    .rgpd-option-icon {
      background: $primary;
      color: white;
    }
  }

  .rgpd-option-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .rgpd-option-icon {
      font-size: 1.5rem;
      background: #f3f4f6;
      border-radius: 50%;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
      transition: all 0.2s;
    }

    strong {
      font-size: 0.9rem;
      color: #111827;
    }

    span {
      font-size: 0.8rem;
      color: #6b7280;
      line-height: 1.5;
    }
  }
}

/* ========================
   THANK YOU CARD
======================== */
.thank-you-card {
  background: white;
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  text-align: center;
  margin-top: $spacing-xl;
  animation: fadeUp 0.5s ease-out;

  .thank-you-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.75rem;
    color: #111827;
    margin-bottom: 1rem;
  }

  > p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .thank-you-box {
    background: linear-gradient(135deg, rgba(0,177,230,0.06) 0%, rgba(255,220,0,0.06) 100%);
    border: 1px solid rgba(0,177,230,0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: left;
    margin-bottom: 1.5rem;

    p {
      color: #374151;
      line-height: 1.7;
      margin-bottom: 0.75rem;
      &:last-child { margin-bottom: 0; }
    }
  }

  .thank-you-footer {
    font-size: 0.875rem;
    color: #9ca3af;
  }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========================
   PROGRESS BAR
======================== */
.progress-bar {
  @include card;
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  position: relative;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-radius: $radius-xl;
  border-left: 4px solid $primary;

  .progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, $primary 0%, rgba(147, 51, 234, 0.8) 100%);
    opacity: 0.15;
    transition: width 0.5s ease;
  }

  .progress-text {
    position: relative;
    z-index: 1;
    font-weight: 600;
    color: $gray-700;
    font-size: $font-size-base;
  }
}

.questions {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.question-card {
  @include card;
  padding: $spacing-xl;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-radius: $radius-xl;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-left-color: $primary;
  }
}

.question-header {
  @include flex-between;
  margin-bottom: $spacing-md;
}

.question-number {
  font-weight: 600;
  color: $primary;
}

.dimension-badge {
  padding: $spacing-xs $spacing-sm;
  background: $gray-200;
  border-radius: $radius-md;
  font-size: $font-size-xs;
  text-transform: uppercase;
}

.question-text {
  font-size: $font-size-lg;
  margin-bottom: $spacing-lg;
  font-weight: 500;
}

.answer-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: $spacing-sm;
}

.option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md $spacing-lg;
  border: 2px solid $gray-300;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  background: white;
  position: relative;
  overflow: hidden;

  input {
    margin-right: $spacing-sm;
    cursor: pointer;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  &:hover {
    border-color: $primary;
    background: linear-gradient(135deg, rgba(0, 177, 230, 0.05) 0%, rgba(255, 220, 0, 0.05) 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 177, 230, 0.15);
    
    &::before {
      left: 100%;
    }
  }

  &.selected {
    border-color: $primary;
    background: linear-gradient(135deg, rgba(0, 177, 230, 0.1) 0%, rgba(255, 220, 0, 0.1) 100%);
    color: #111827;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(255, 220, 0, 0.3);
  }
}

.actions {
  text-align: center;
  padding: $spacing-xl 0;
}

/* ========================
   SPINNER BOUTON
======================== */
.spinner-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.spinner {
  animation: rotate 1.5s linear infinite;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.spinner .path {
  stroke: white;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

.btn-primary {
  @include button-primary;
  padding: $spacing-md $spacing-xl;
  font-size: $font-size-lg;
  min-width: 240px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading, .error {
  text-align: center;
  padding: $spacing-2xl;
  color: $gray-600;
}

.error {
  color: $danger;
}
</style>

