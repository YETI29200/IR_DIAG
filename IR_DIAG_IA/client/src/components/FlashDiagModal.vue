<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <button class="btn-close" @click="close">&times;</button>
      
      <!-- Progress Header -->
      <div v-if="step !== 'loading' && step !== 'result'" class="modal-progress">
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <div class="steps-info">
          <span>{{ currentStepTitle }}</span>
          <span>{{ currentStepIndex }} / {{ totalSteps }}</span>
        </div>
      </div>

      <div class="modal-content" ref="modalContent">
        <!-- Intro Step -->
        <div v-if="step === 'intro'" class="step-fade">
          <div class="step-header">
            <div class="icon-circle icon-blue">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2>Flash Diag</h2>
            <p>Évaluez rapidement votre maturité IA en quelques minutes.</p>
          </div>
          <div class="intro-details">
            <div class="detail-item">
              <strong>5-10 minutes</strong>
              <span>Rapide et efficace</span>
            </div>
            <div class="detail-item">
              <strong>Sans connexion</strong>
              <span>Accès libre immédiat</span>
            </div>
            <div class="detail-item">
              <strong>Rapport IA</strong>
              <span>Envoyé par email</span>
            </div>
          </div>
          <div class="btn-action-container">
            <button class="btn-primary btn-block" @click="startDiag">Démarrer le diagnostic</button>
          </div>
        </div>

        <!-- Questionnaire Steps -->
        <div v-else-if="step === 'questionnaire'" class="step-fade">
          <div v-if="currentSection" class="section-content">
            <h3 class="section-label">{{ currentSection.label }}</h3>
            <div class="questions-list">
              <div v-for="q in currentSection.questions" :key="q.id" class="question-item">
                <p class="question-label">{{ q.label }}</p>
                <div class="options-grid">
                  <button 
                    v-for="opt in q.options" 
                    :key="opt.value"
                    :class="['option-btn', { active: answers[q.id] === opt.value }]"
                    @click="setAnswer(q.id, opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="btn-action-container">
            <button class="btn-secondary" v-if="sectionIndex > 0" @click="prevSection">Retour</button>
            <button class="btn-primary" :disabled="!isSectionComplete" @click="nextSection">
              {{ isLastSection ? 'Continuer' : 'Suivant' }}
            </button>
          </div>
        </div>

        <!-- Contact Step -->
        <div v-else-if="step === 'contact'" class="step-fade">
          <div class="step-header">
            <h3>Informations de contact</h3>
            <p>Pour vous envoyer votre rapport personnalisé.</p>
          </div>
          <form @submit.prevent="submitDiag" class="contact-form">
            <div v-for="field in contactFields" :key="field.id" class="form-group">
              <label :for="field.id">{{ field.label }} <span v-if="field.required" class="required">*</span></label>
              
              <input v-if="field.type === 'text' || field.type === 'email' || field.type === 'number' || field.type === 'tel'"
                :type="field.type"
                :id="field.id"
                v-model="contactInfo[field.id]"
                :required="field.required"
                class="form-input"
              />
              
              <select v-else-if="field.type === 'single_select'"
                :id="field.id"
                v-model="contactInfo[field.id]"
                :required="field.required"
                class="form-select"
              >
                <option value="" disabled>Sélectionnez...</option>
                <option v-for="opt in getFieldOptions(field)" :key="opt.value || opt" :value="opt.value || opt">
                  {{ opt.label || opt }}
                </option>
              </select>
            </div>
            <div class="btn-action-container">
              <button type="button" class="btn-secondary" @click="step = 'questionnaire'">Retour</button>
              <button type="submit" class="btn-primary" :disabled="submitting">
                {{ submitting ? 'Génération en cours...' : 'Envoyer et voir mon score' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Loading / API Working -->
        <div v-else-if="step === 'loading'" class="step-fade loading-step">
          <div class="loader"></div>
          <h3>Analyse de vos réponses par l'IA...</h3>
          <p>Nous générons vos recommandations personnalisées.</p>
          <div class="ai-progress">
            <span class="ai-tip">Conseil : Pensez à vérifier vos spams pour le rapport complet.</span>
          </div>
        </div>

        <!-- Result Step -->
        <div v-else-if="step === 'result'" class="step-fade result-step">
          <div class="icon-circle icon-green">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>Diagnostic terminé !</h2>
          
          <div class="result-score">
            <div class="score-value">{{ results.globalScore }}%</div>
            <div class="score-label">Maturité : {{ results.maturityLevel }}</div>
          </div>

          <p class="report-info">
            Un rapport complet contenant vos recommandations personnalisées vient d'être envoyé à 
            <strong>{{ contactInfo.email_un_rapport_vous_sera_automatiquement_envoye_a_cette_ad }}</strong>.
          </p>

          <div class="btn-action-container">
            <button class="btn-primary btn-block" @click="close">Fermer et retourner à l'accueil</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const step = ref('intro') // intro, questionnaire, contact, loading, result
const questionnaireData = ref<any>(null)
const contactFormConfig = ref<any>(null)
const answers = ref<Record<string, string>>({})
const contactInfo = ref<Record<string, string>>({})
const sectionIndex = ref(0)
const submitting = ref(false)
const results = ref<any>(null)
const modalContent = ref<HTMLElement | null>(null)

function scrollToTop() {
  nextTick(() => {
    if (modalContent.value) {
      modalContent.value.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })
}

const progressPercent = computed(() => {
  if (step.value === 'intro') return 0
  if (step.value === 'contact') return 90
  if (step.value === 'questionnaire') {
    return 10 + (sectionIndex.value / (questionnaireData.value?.sections?.length || 1)) * 80
  }
  return 100
})

const currentStepTitle = computed(() => {
  if (step.value === 'intro') return 'Introduction'
  if (step.value === 'questionnaire') return currentSection.value?.label || 'Questionnaire'
  if (step.value === 'contact') return 'Contact'
  return ''
})

const currentStepIndex = computed(() => {
  if (step.value === 'intro') return 1
  if (step.value === 'questionnaire') return 2 + sectionIndex.value
  if (step.value === 'contact') return 2 + (questionnaireData.value?.sections?.length || 0)
  return 0
})

const totalSteps = computed(() => {
  return 2 + (questionnaireData.value?.sections?.length || 0)
})

const currentSection = computed(() => {
  return questionnaireData.value?.sections[sectionIndex.value]
})

const isLastSection = computed(() => {
  return sectionIndex.value === (questionnaireData.value?.sections?.length || 0) - 1
})

const isSectionComplete = computed(() => {
  if (!currentSection.value) return false
  return currentSection.value.questions.every((q: any) => answers.value[q.id] !== undefined)
})

const contactFields = computed(() => {
  return contactFormConfig.value?.fields || []
})

// Fetch config when modal opens
watch(() => props.isOpen, async (val) => {
  if (val && !questionnaireData.value) {
    try {
      const resp = await fetch('/api/flash/config')
      const data = await resp.json()
      questionnaireData.value = data.questionnaire
      contactFormConfig.value = data.contactForm
    } catch (err) {
      console.error('Failed to load flash diag config', err)
    }
  }
})

function close() {
  emit('close')
  // Reset after a delay
  setTimeout(() => {
    step.value = 'intro'
    answers.value = {}
    contactInfo.value = {}
    sectionIndex.value = 0
    results.value = null
  }, 300)
}

function startDiag() {
  step.value = 'questionnaire'
  scrollToTop()
}

function setAnswer(questionId: string, value: string) {
  answers.value[questionId] = value
}

function nextSection() {
  if (isLastSection.value) {
    step.value = 'contact'
  } else {
    sectionIndex.value++
  }
  scrollToTop()
}

function prevSection() {
  sectionIndex.value--
  scrollToTop()
}

function getFieldOptions(field: any) {
  if (field.options && field.options.length > 0) return field.options
  
  // Provide defaults for empty option lists
  if (field.id === 'secteur_d_activite') {
    return ['Aéronautique', 'Agroalimentaire', 'Automobile', 'Construction', 'Énergie', 'Luxe', 'Santé', 'Services', 'Technologie', 'Autre']
  }
  if (field.id === 'taille_de_l_entreprise') {
    return ['TPE (< 10 sal.)', 'PME (10-250 sal.)', 'ETI (250-5000 sal.)', 'GE (> 5000 sal.)']
  }
  if (field.id === 'comment_avez_vous_eu_connaissance_du_dispositif') {
    return ['Newsletter', 'Réseaux Sociaux', 'Partenaire', 'Bouche à oreille', 'Événement', 'Moteur de recherche']
  }
  if (field.id === 'souhaitez_vous_etre_recontacte_par_nos_equipes_pour_benefici') {
    return [{ label: 'Oui', value: 'oui' }, { label: 'Non', value: 'non' }]
  }
  
  return []
}

async function submitDiag() {
  submitting.value = true
  step.value = 'loading'
  
  try {
    const response = await fetch('/api/flash/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: answers.value,
        contactInfo: contactInfo.value
      })
    })
    
    const data = await response.json()
    if (data.success) {
      results.value = data
      step.value = 'result'
    } else {
      throw new Error(data.error || 'Submission failed')
    }
  } catch (err) {
    alert('Erreur lors de la soumission. Veuillez réessayer.')
    step.value = 'contact'
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-up 0.4s ease-out;
}

@keyframes modal-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.btn-close {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: #f3f4f6;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;
  
  &:hover { background: #e5e7eb; transform: rotate(90deg); }
}

.modal-progress {
  padding: 1.5rem 1.5rem 0.5rem;
  
  .progress-track {
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #00B1E6 0%, #FFDC00 100%);
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .steps-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
}

.step-fade {
  animation: fade-in 0.4s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
  
  h2, h3 { color: #111827; margin-bottom: 0.5rem; }
  p { color: #6b7280; font-size: 0.875rem; }
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  
  &.icon-blue { background: #00B1E6; box-shadow: 0 0 20px rgba(0, 177, 230, 0.4); }
  &.icon-green { background: #10b981; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
}

.intro-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
  
  .detail-item {
    background: #f9fafb;
    padding: 1.25rem 0.75rem;
    border-radius: 1rem;
    text-align: center;
    border: 1px solid #f3f4f6;
    
    strong { display: block; font-size: 0.875rem; color: #111827; margin-bottom: 0.25rem; }
    span { font-size: 0.75rem; color: #6b7280; }
  }
}

.section-label {
  font-size: 1.125rem;
  font-weight: 700;
  color: #00B1E6;
  margin-bottom: 1.5rem;
  border-left: 4px solid #FFDC00;
  padding-left: 0.75rem;
}

.question-item {
  margin-bottom: 2rem;
  
  .question-label {
    font-weight: 600;
    margin-bottom: 1rem;
    color: #374151;
    line-height: 1.5;
  }
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.option-btn {
  padding: 1rem 0.75rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 0.75rem;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 4.5rem;
  line-height: 1.3;
  word-break: break-word;
  hyphens: auto;
  
  &:hover { border-color: #00B1E6; background: #f0f9ff; }
  
  &.active {
    background: #00B1E6;
    border-color: #00B1E6;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 177, 230, 0.3);
  }
}

.contact-form {
  .form-group {
    margin-bottom: 1.25rem;
    
    label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .required { color: #ef4444; }
  }
  
  .form-input, .form-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
    
    &:focus { outline: none; border-color: #00B1E6; ring: 2px solid rgba(0, 177, 230, 0.2); }
  }
}

.btn-action-container {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.btn-primary {
  background: #00B1E6;
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s;
  
  &:hover { background: #0093c0; transform: translateY(-1px); }
  &:disabled { background: #9ca3af; cursor: not-allowed; }
}

.btn-secondary {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover { background: #e5e7eb; }
}

.btn-block { width: 100%; }

.loading-step {
  text-align: center;
  padding: 4rem 0;
  
  h3 { margin-bottom: 1rem; }
  p { color: #6b7280; }
}

.loader {
  width: 64px;
  height: 64px;
  border: 5px solid #f3f4f6;
  border-top: 5px solid #00B1E6;
  border-radius: 50%;
  margin: 0 auto 2rem;
  animation: spin 1s linear infinite;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.ai-tip {
  display: block;
  margin-top: 3rem;
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.result-step {
  text-align: center;
  padding: 1rem 0;
  
  h2 { margin-bottom: 2rem; }
}

.result-score {
  margin: 2rem 0;
  
  .score-value {
    font-size: 4rem;
    font-weight: 800;
    color: #00B1E6;
    line-height: 1;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #00B1E6 0%, #FFDC00 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .score-label {
    font-size: 1.25rem;
    font-weight: 700;
    color: #4b5563;
  }
}

.report-info {
  background: #f0fdf4;
  padding: 1.25rem;
  border-radius: 1rem;
  color: #166534;
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}
</style>
