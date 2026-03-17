<template>
  <div class="mission-new">
    <header class="header">
      <div class="container">
        <BackButton to="/admin/dashboard" label="Retour au dashboard" />
        <div class="header-content">
          <h1>Nouvelle mission</h1>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <div class="wizard">
          <div class="wizard-steps">
            <div
              v-for="(step, index) in steps"
              :key="index"
              :class="['step', { active: currentStep === index, completed: currentStep > index }]"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-label">{{ step.label }}</div>
            </div>
          </div>

          <div class="wizard-content">
            <!-- Step 1: Organization -->
            <div v-if="currentStep === 0" class="step-content">
              <h2>Informations organisation</h2>
              <div class="form-row">
                <div class="form-group">
                  <label>Nom de l'organisation *</label>
                  <input v-model="form.organizationName" type="text" required />
                </div>
                <div class="form-group">
                  <label>Secteur</label>
                  <select v-model="form.sector">
                    <option value="">Sélectionner un secteur</option>
                    <option value="Aéronautique">Aéronautique</option>
                    <option value="Agroalimentaire">Agroalimentaire</option>
                    <option value="Automobile">Automobile</option>
                    <option value="Construction / BTP">Construction / BTP</option>
                    <option value="Énergie">Énergie</option>
                    <option value="Numérique / Tech">Numérique / Tech</option>
                    <option value="Santé / Médical">Santé / Médical</option>
                    <option value="Services aux entreprises">Services aux entreprises</option>
                    <option value="Textile / Mode">Textile / Mode</option>
                    <option value="Transport / Logistique">Transport / Logistique</option>
                    <option value="Collectivité / Public">Collectivité / Public</option>
                    <option value="Éducation / Formation">Éducation / Formation</option>
                    <option value="Luxe">Luxe</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre d'employés</label>
                  <input v-model.number="form.employees" type="number" min="0" />
                </div>
                <div class="form-group">
                  <label>Type de questionnaire *</label>
                  <select v-model="form.questionnaireType" required>
                    <option value="flash">Flash (20 questions)</option>
                    <option value="full">Complet (80 questions)</option>
                  </select>
                </div>
              </div>
              
              <div class="section-divider">
                <h3>Coordonnées de l'entreprise</h3>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Adresse</label>
                  <input v-model="form.organizationAddressLine" type="text" placeholder="Numéro et nom de rue" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Code postal</label>
                  <input v-model="form.organizationPostalCode" type="text" placeholder="35000" maxlength="10" />
                </div>
                <div class="form-group">
                  <label>Ville</label>
                  <input v-model="form.organizationCity" type="text" placeholder="Rennes" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Région</label>
                  <select v-model="form.organizationRegion">
                    <option value="">Sélectionner une région</option>
                    <option value="Pays de la Loire">Pays de la Loire</option>
                    <option value="Bretagne">Bretagne</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Téléphone</label>
                  <input v-model="form.organizationPhone" type="tel" placeholder="01 23 45 67 89" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input v-model="form.organizationEmail" type="email" placeholder="contact@entreprise.fr" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Site web</label>
                  <input v-model="form.organizationWebsite" type="url" placeholder="https://www.entreprise.fr" />
                </div>
              </div>
            </div>

            <!-- Step 2: Services -->
            <div v-if="currentStep === 1" class="step-content">
              <h2>Services / Directions</h2>
              <p>Définissez les services ou directions à évaluer</p>
              
              <!-- Liste des services validés -->
              <div
                v-for="(service, index) in form.services"
                :key="index"
                class="service-item service-item-validated"
              >
                <input 
                  v-model="service.name" 
                  type="text" 
                  :placeholder="`Service ${index + 1}`" 
                  disabled
                  class="service-input-validated"
                />
                <button type="button" @click="removeService(index)" class="btn-danger">
                  Supprimer
                </button>
              </div>

              <!-- Formulaire de création de service -->
              <div class="service-item service-item-new">
                <input 
                  v-model="newServiceName" 
                  type="text" 
                  placeholder="Nom du service" 
                  @keyup.enter="createService"
                  class="service-input-new"
                />
                <div class="btn-create-wrapper" :class="{ 'has-tooltip': serviceCreated }">
                  <button 
                    type="button" 
                    @click="createService" 
                    :disabled="!newServiceName.trim()"
                    :class="['btn-create-service', serviceCreated ? 'btn-success' : 'btn-primary']"
                  >
                    <span v-if="serviceCreated" class="service-created-icon">✓</span>
                    {{ serviceCreated ? 'Créé' : 'Créer' }}
                  </button>
                  <span v-if="serviceCreated" class="tooltip">Service créé</span>
                </div>
              </div>
              
              <div v-if="form.services.length === 0" class="no-services-message">
                <p>Aucun service créé. Ajoutez au moins un service pour continuer.</p>
              </div>
            </div>

            <!-- Step 3: Contacts -->
            <div v-if="currentStep === 2" class="step-content">
              <h2>Contacts</h2>
              <p>Ajoutez les contacts pour chaque service</p>
              <div
                v-for="(contact, index) in form.contacts"
                :key="index"
                class="contact-item"
              >
                <div class="form-row">
                  <div class="form-group">
                    <label>Prénom *</label>
                    <input v-model="contact.firstName" type="text" required />
                  </div>
                  <div class="form-group">
                    <label>Nom *</label>
                    <input v-model="contact.lastName" type="text" required />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Email *</label>
                    <input v-model="contact.email" type="email" required />
                  </div>
                  <div class="form-group">
                    <label>Téléphone</label>
                    <input v-model="contact.phone" type="tel" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Poste</label>
                    <input v-model="contact.role" type="text" />
                  </div>
                  <div class="form-group">
                    <label>Service</label>
                    <select v-model="contact.serviceId">
                      <option :value="null">Aucun</option>
                      <option
                        v-for="(service, sIdx) in form.services"
                        :key="sIdx"
                        :value="sIdx"
                      >
                        {{ service.name }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="contact-actions">
                  <div class="contact-checkboxes">
                    <label class="checkbox-label">
                      <input v-model="contact.isPrimary" type="checkbox" />
                      <span>Contact principal</span>
                    </label>
                    <label class="checkbox-label">
                      <input v-model="contact.isReferent" type="checkbox" />
                      <span>Chef de projet côté organisation</span>
                    </label>
                  </div>
                  <button type="button" @click="removeContact(index)" class="btn-danger">
                    Supprimer
                  </button>
                </div>
              </div>
              <button type="button" @click="addContact" class="btn-secondary">
                + Ajouter un contact
              </button>
            </div>

            <!-- Step 4: Confirmation -->
            <div v-if="currentStep === 3" class="step-content">
              <h2>Confirmation</h2>
              <div class="summary">
                <h3>Organisation</h3>
                <p><strong>Nom:</strong> {{ form.organizationName }}</p>
                <p><strong>Secteur:</strong> {{ form.sector || 'Non spécifié' }}</p>
                <p><strong>Employés:</strong> {{ form.employees || 'Non spécifié' }}</p>
                <p><strong>Type:</strong> {{ form.questionnaireType === 'flash' ? 'Flash' : 'Complet' }}</p>

                <h3>Services ({{ form.services.length }})</h3>
                <ul>
                  <li v-for="(service, index) in form.services" :key="index">
                    {{ service.name }}
                  </li>
                </ul>

                <h3>Contacts ({{ form.contacts.length }})</h3>
                <ul>
                  <li v-for="(contact, index) in form.contacts" :key="index">
                    {{ contact.firstName }} {{ contact.lastName }} ({{ contact.email }})
                  </li>
                </ul>
              </div>
            </div>

            <div class="wizard-actions">
              <button
                v-if="currentStep > 0"
                @click="previousStep"
                class="btn-secondary"
              >
                Précédent
              </button>
              <button
                v-if="currentStep < steps.length - 1"
                @click="nextStep"
                class="btn-primary"
              >
                Suivant
              </button>
              <button
                v-if="currentStep === steps.length - 1"
                @click="submitMission"
                :disabled="submitting"
                class="btn-primary"
              >
                {{ submitting ? 'Création...' : 'Créer la mission' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ params: any; query: any }>()
import { ref, reactive, inject } from 'vue'
import BackButton from '../../components/BackButton.vue'

const router = inject('router') as any

const steps = [
  { label: 'Organisation' },
  { label: 'Services' },
  { label: 'Contacts' },
  { label: 'Confirmation' }
]

const currentStep = ref(0)
const submitting = ref(false)
const newServiceName = ref('')
const serviceCreated = ref(false)

const form = reactive({
  organizationName: '',
  sector: '',
  employees: null as number | null,
  questionnaireType: 'flash' as 'flash' | 'full',
  organizationAddressLine: '',
  organizationPostalCode: '',
  organizationCity: '',
  organizationRegion: '',
  organizationPhone: '',
  organizationEmail: '',
  organizationWebsite: '',
  services: [] as Array<{ name: string }>,
  contacts: [{
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    serviceId: null as number | null,
    isPrimary: false,
    isReferent: false
  }] as Array<any>
})

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function createService() {
  const name = newServiceName.value.trim()
  if (!name) return
  
  // Ajouter le service à la liste
  form.services.push({ name })
  
  // Réinitialiser le champ et afficher le feedback
  newServiceName.value = ''
  serviceCreated.value = true
  
  // Réinitialiser le feedback après 2 secondes
  setTimeout(() => {
    serviceCreated.value = false
  }, 2000)
}

function removeService(index: number) {
  form.services.splice(index, 1)
}

function addContact() {
  form.contacts.push({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    serviceId: null,
    isPrimary: false,
    isReferent: false
  })
}

function removeContact(index: number) {
  form.contacts.splice(index, 1)
}

async function submitMission() {
  submitting.value = true

  try {
    const consultantStr = localStorage.getItem('consultant')
    if (!consultantStr) {
      alert('Consultant non identifié')
      return
    }

    const consultant = JSON.parse(consultantStr)
    const token = localStorage.getItem('auth_token')

    // Map service indices to actual service IDs (will be created on server)
    const services = form.services.map(s => ({ name: s.name }))
    const contacts = form.contacts.map(c => ({
      ...c,
      serviceId: c.serviceId !== null ? c.serviceId : undefined
    }))

    const response = await fetch('/api/missions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        consultantId: consultant.id,
        organizationName: form.organizationName,
        sector: form.sector || null,
        employees: form.employees || null,
        questionnaireType: form.questionnaireType,
        organizationAddressLine: form.organizationAddressLine || null,
        organizationPostalCode: form.organizationPostalCode || null,
        organizationCity: form.organizationCity || null,
        organizationRegion: form.organizationRegion || null,
        organizationPhone: form.organizationPhone || null,
        organizationEmail: form.organizationEmail || null,
        organizationWebsite: form.organizationWebsite || null,
        services,
        contacts
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la création')
    }

    const data = await response.json()
    router.push(`/admin/missions/${data.missionId || 'new'}`)
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la création de la mission')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.mission-new {
  min-height: 100vh;
  background: $gray-100;
}

.header {
  background: white;
  box-shadow: $shadow-sm;
  padding: $spacing-lg 0;
  margin-bottom: $spacing-xl;

  .container {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    margin: 0;
  }
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 $spacing-lg;
}

.wizard {
  @include card;
  padding: $spacing-xl;
}

.wizard-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: $spacing-2xl;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 25px;
    left: 0;
    right: 0;
    height: 2px;
    background: $gray-300;
    z-index: 0;
  }
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  flex: 1;

  .step-number {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: $gray-300;
    color: $gray-600;
    @include flex-center;
    font-weight: bold;
    margin-bottom: $spacing-sm;
    transition: all 0.3s;
  }

  .step-label {
    font-size: $font-size-sm;
    color: $gray-600;
  }

  &.active .step-number {
    background: $primary;
    color: white;
  }

  &.completed .step-number {
    background: $success;
    color: white;
  }
}

.wizard-content {
  min-height: 400px;
}

.step-content {
  h2 {
    margin-bottom: $spacing-lg;
  }
}

.form-group {
  margin-bottom: $spacing-lg;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 500;
  }

  input, select {
    @include input;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.service-item, .contact-item {
  @include card;
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;

  input, select {
    margin-bottom: $spacing-md;
  }
}

.contact-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $gray-200;
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    cursor: pointer;
    font-weight: 500;
    
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin: 0;
      cursor: pointer;
    }
    
    span {
      user-select: none;
    }
  }
}

.service-item-new {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  
  .service-input-new {
    flex: 1;
    @include input;
    margin-bottom: 0;
  }
  
  .btn-create-wrapper {
    position: relative;
    
    &.has-tooltip {
      .tooltip {
        display: block;
      }
    }
    
    .tooltip {
      display: none;
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: $spacing-xs;
      padding: $spacing-xs $spacing-sm;
      background: $gray-900;
      color: white;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
      white-space: nowrap;
      z-index: 10;
      pointer-events: none;
      
      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: $gray-900;
      }
    }
  }
  
  .btn-create-service {
    @include button-primary;
    white-space: nowrap;
    position: relative;
    transition: all 0.3s ease;
    
    &.btn-success {
      background: $success;
      color: white;
      
      &:hover {
        background: darken($success, 10%);
      }
    }
    
    .service-created-icon {
      margin-right: $spacing-xs;
      font-weight: bold;
    }
  }
}

.service-item-validated {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  
  .service-input-validated {
    flex: 1;
    @include input;
    margin-bottom: 0;
    background: $gray-50;
    color: $gray-700;
    cursor: not-allowed;
  }
}

.no-services-message {
  padding: $spacing-lg;
  background: $gray-50;
  border-radius: $radius-md;
  text-align: center;
  color: $gray-600;
  margin-top: $spacing-md;
}

.summary {
  h3 {
    margin-top: $spacing-lg;
    margin-bottom: $spacing-md;
    color: $primary;
  }

  ul {
    margin-left: $spacing-lg;
    margin-bottom: $spacing-lg;
  }
}

.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-xl;
  padding-top: $spacing-xl;
  border-top: 1px solid $gray-200;
}

.btn-primary {
  @include button-primary;
}

.btn-secondary {
  @include button-secondary;
}

.btn-danger {
  background: $danger;
  color: white;
  border: none;
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-md;
  cursor: pointer;
  font-size: $font-size-sm;

  &:hover {
    background: $danger-dark; // Rouge foncé Images & Réseaux
  }
}
</style>

