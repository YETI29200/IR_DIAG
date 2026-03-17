<template>
  <div class="mission-details">
    <header v-if="mission && !isEditing" class="header">
      <div class="container">
        <router-link to="/admin/dashboard" class="btn-back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Retour au dashboard
        </router-link>

        <div class="header-content">
          <div class="page-title-section">
            <div class="title-with-badge">
              <h1 class="page-title">{{ mission.organizationName }}</h1>
              <span :class="['badge-status', mission.status]">{{ mission.status === 'in_progress' ? 'EN COURS' : mission.status === 'closed' ? 'Clôturée' : mission.status === 'suspended' ? 'Suspendue' : 'En préparation' }}</span>
            </div>
            <p class="mission-subtitle">Maturité IA - {{ mission.sector || 'Secteur non défini' }}</p>
          </div>

          <div class="header-actions">
            <button class="btn-secondary" @click="startEditing(0)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.3333 2.00001C11.5084 1.8249 11.7163 1.68696 11.9447 1.59431C12.1731 1.50166 12.4173 1.45605 12.6637 1.46001C12.9101 1.46398 13.1529 1.51742 13.3779 1.61716C13.6029 1.7169 13.8055 1.86085 13.9733 2.04001C14.1412 2.21918 14.2708 2.43022 14.3547 2.66062C14.4386 2.89102 14.475 3.13614 14.4613 3.38068C14.4477 3.62522 14.3842 3.86419 14.2747 4.08334C14.1652 4.3025 14.012 4.49744 13.824 4.65601L6.15733 12.3227L2.66667 13.3333L3.67733 9.84268L11.344 2.17601L11.3333 2.00001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Modifier
            </button>
            <button v-if="mission.status === 'suspended'" class="btn-warning" @click="toggleSuspendMission">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 3L12 8L4 13V3Z" fill="currentColor"/>
              </svg>
              Reprendre la mission
            </button>
            <button v-else-if="mission.status !== 'closed'" class="btn-warning" @click="toggleSuspendMission">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="4" width="2" height="8" fill="currentColor"/>
                <rect x="9" y="4" width="2" height="8" fill="currentColor"/>
              </svg>
              Suspendre
            </button>
            <router-link :to="`/results?mission=${mission.id}`" class="btn-primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V13H13V3H3ZM5 5H11V11H5V5Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M7 7H9M7 9H9M7 11H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Voir les résultats
            </router-link>
            <button class="btn-danger" @click="handleDelete">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V13.3333C12 13.687 11.8595 14.0261 11.6095 14.2761C11.3594 14.5262 11.0203 14.6667 10.6667 14.6667H5.33333C4.97971 14.6667 4.64057 14.5262 4.39052 14.2761C4.14048 14.0261 4 13.687 4 13.3333V4M6 4V2.66667C6 2.31305 6.14048 1.97391 6.39052 1.72386C6.64057 1.47381 6.97971 1.33333 7.33333 1.33333H8.66667C9.02029 1.33333 9.35943 1.47381 9.60948 1.72386C9.85952 1.97391 10 2.31305 10 2.66667V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 4H14M10 7V11M6 7V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <div v-if="loading" class="loading">Chargement...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        
        <!-- Mode édition -->
        <div v-else-if="isEditing && mission" class="mission-edit">
          <header class="edit-header">
            <div class="container">
              <div class="edit-header-content">
                <div>
                  <h1>Modifier la mission</h1>
                  <p class="edit-subtitle">{{ mission.organizationName }}</p>
                </div>
                <button @click="cancelEditing" class="btn-secondary">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Annuler
                </button>
              </div>
            </div>
          </header>
          
          <main class="main">
            <div class="container">
              <div class="wizard">
            <div class="wizard-steps">
              <div
                v-for="(step, index) in editSteps"
                :key="index"
                :class="['step', { active: currentEditStep === index, completed: currentEditStep > index }]"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-label">{{ step.label }}</div>
              </div>
            </div>

            <div class="wizard-content">
              <!-- Step 1: Organisation -->
              <div v-if="currentEditStep === 0" class="step-content">
                <h2>Informations de l'organisation</h2>
                <div class="form-group">
                  <label>Nom de l'organisation *</label>
                  <input v-model="editForm.organizationName" type="text" required />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Secteur</label>
                    <input v-model="editForm.sector" type="text" />
                  </div>
                  <div class="form-group">
                    <label>Nombre d'employés</label>
                    <input v-model.number="editForm.employees" type="number" min="0" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Type de questionnaire *</label>
                    <select v-model="editForm.questionnaireType" required>
                      <option value="flash">Flash (20 questions)</option>
                      <option value="full">Complet (80 questions)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Statut</label>
                    <select v-model="editForm.status">
                      <option value="preparation">En préparation</option>
                      <option value="in_progress">EN COURS</option>
                      <option value="suspended">Suspendue</option>
                      <option value="closed">Clôturée</option>
                    </select>
                  </div>
                </div>
                
                <div class="section-divider">
                  <h3>Coordonnées de l'entreprise</h3>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Adresse</label>
                    <input v-model="editForm.organizationAddressLine" type="text" placeholder="Numéro et nom de rue" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Code postal</label>
                    <input v-model="editForm.organizationPostalCode" type="text" placeholder="35000" maxlength="10" />
                  </div>
                  <div class="form-group">
                    <label>Ville</label>
                    <input v-model="editForm.organizationCity" type="text" placeholder="Rennes" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Région</label>
                    <select v-model="editForm.organizationRegion">
                      <option value="">Sélectionner une région</option>
                      <option value="Pays de la Loire">Pays de la Loire</option>
                      <option value="Bretagne">Bretagne</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Téléphone</label>
                    <input v-model="editForm.organizationPhone" type="tel" placeholder="01 23 45 67 89" />
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input v-model="editForm.organizationEmail" type="email" placeholder="contact@entreprise.fr" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Site web</label>
                    <input v-model="editForm.organizationWebsite" type="url" placeholder="https://www.entreprise.fr" />
                  </div>
                </div>
              </div>

              <!-- Step 2: Services -->
              <div v-if="currentEditStep === 1" class="step-content">
                <h2>Services / Directions</h2>
                <p>Définissez les services ou directions à évaluer</p>
                
                <div
                  v-for="(service, index) in editForm.services"
                  :key="index"
                  class="service-item service-item-validated"
                >
                  <input 
                    v-model="service.name" 
                    type="text" 
                    :placeholder="`Service ${index + 1}`" 
                    class="service-input-validated"
                  />
                  <button type="button" @click="removeService(index)" class="btn-danger">
                    Supprimer
                  </button>
                </div>

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
                
                <div v-if="editForm.services.length === 0" class="no-services-message">
                  <p>Aucun service créé. Ajoutez au moins un service pour continuer.</p>
                </div>
              </div>

              <!-- Step 3: Contacts -->
              <div v-if="currentEditStep === 2" class="step-content">
                <h2>Contacts</h2>
                <p>Ajoutez les contacts pour chaque service</p>
                <div
                  v-for="(contact, index) in editForm.contacts"
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
                          v-for="(service, sIdx) in editForm.services"
                          :key="sIdx"
                          :value="service.id"
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
              <div v-if="currentEditStep === 3" class="step-content">
                <h2>Confirmation</h2>
                <div class="summary">
                  <h3>Organisation</h3>
                  <p><strong>Nom:</strong> {{ editForm.organizationName }}</p>
                  <p><strong>Secteur:</strong> {{ editForm.sector || 'Non spécifié' }}</p>
                  <p><strong>Employés:</strong> {{ editForm.employees || 'Non spécifié' }}</p>
                  <p><strong>Type:</strong> {{ editForm.questionnaireType === 'flash' ? 'Flash' : 'Complet' }}</p>
                  <p><strong>Statut:</strong> {{ editForm.status === 'in_progress' ? 'EN COURS' : editForm.status === 'closed' ? 'Clôturée' : editForm.status === 'suspended' ? 'Suspendue' : 'En préparation' }}</p>

                  <h3>Services ({{ editForm.services.length }})</h3>
                  <ul>
                    <li v-for="(service, index) in editForm.services" :key="index">
                      {{ service.name }}
                    </li>
                  </ul>

                  <h3>Contacts ({{ editForm.contacts.length }})</h3>
                  <ul>
                    <li v-for="(contact, index) in editForm.contacts" :key="index">
                      {{ contact.firstName }} {{ contact.lastName }} ({{ contact.email }})
                    </li>
                  </ul>
                </div>
              </div>

              <div class="wizard-actions">
                <button
                  v-if="currentEditStep > 0"
                  @click="previousEditStep"
                  class="btn-secondary"
                >
                  Précédent
                </button>
                <button
                  v-if="currentEditStep < editSteps.length - 1"
                  @click="nextEditStep"
                  class="btn-primary"
                >
                  Suivant
                </button>
                <button
                  v-if="currentEditStep === editSteps.length - 1"
                  @click="handleSave"
                  :disabled="submitting"
                  class="btn-primary"
                >
                  {{ submitting ? 'Sauvegarde...' : 'Enregistrer les modifications' }}
                </button>
              </div>
            </div>
          </div>
            </div>
          </main>
        </div>
        
        <!-- Mode affichage -->
        <div v-else-if="mission" class="mission-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3V17H17V3H3ZM5 5H15V15H5V5Z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </div>
              <div class="summary-content">
                <h3>Services</h3>
                <p class="summary-value">{{ mission.services?.length || 0 }}</p>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-content">
                <h3>Répondants</h3>
                <p class="summary-value">{{ sessions.length }}</p>
                <p class="summary-subtitle">{{ getCompletionPercentage() }}% complétés</p>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 2L11.09 8.26L18 10L11.09 11.74L9 18L6.91 11.74L0 10L6.91 8.26L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-content">
                <h3>Questionnaires complets</h3>
                <p class="summary-value">{{ completedSessions }}</p>
                <p class="summary-subtitle">sur {{ sessions.length }}</p>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 2H5C3.89543 2 3 2.89543 3 4V16C3 17.1046 3.89543 18 5 18H15C16.1046 18 17 17.1046 17 16V4C17 2.89543 16.1046 2 15 2Z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M3 7H17M7 2V7M13 2V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="summary-content">
                <h3>Clôture</h3>
                <p class="summary-value">{{ mission.closureDate ? formatDateShort(mission.closureDate) : 'Non définie' }}</p>
              </div>
            </div>
          </div>

          <div class="tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="['tab', `tab-${tab.color}`, { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>


          <div class="tab-content">
            <!-- Overview -->
            <div v-if="activeTab === 'overview'" class="tab-panel">
              <!-- Mini Timeline Card -->
              <div class="info-card timeline-summary-card">
                <div class="card-header-flex">
                  <h2 class="section-title section-title-teal">Suivi de la mission</h2>
                  <span class="step-counter">{{ projectTimeline.filter(s => s.status === 'completed').length }} / {{ projectTimeline.length }} étapes validées</span>
                </div>
                
                <div class="mini-timeline-horizontal">
                  <div
                    v-for="(step, index) in projectTimeline"
                    :key="step.id"
                    :class="['mini-step', step.status]"
                    @click="activeTab = 'timeline'"
                  >
                    <div class="step-node" :title="step.title">
                      <div class="step-circle">
                        <span v-if="step.status === 'completed'" class="check-icon">✓</span>
                        <span v-else>{{ index + 1 }}</span>
                      </div>
                      <span class="step-label-mini">{{ index + 1 }}</span>
                    </div>
                    <div v-if="index < projectTimeline.length - 1" class="step-line"></div>
                  </div>
                </div>
                
                <div class="timeline-footer">
                  <div class="current-step-box" v-if="currentStep">
                    <span class="label">Étape actuelle :</span>
                    <span class="value">{{ currentStep.title }}</span>
                  </div>
                  <button @click="activeTab = 'timeline'" class="btn-more">
                    Détails de la chronologie
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="info-card">
                <div class="card-header-flex">
                  <h2 class="section-title section-title-orange">Informations générales</h2>
                  <button class="btn-edit-small" @click="startEditing(0)">Modifier</button>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Organisation</label>
                    <p>{{ mission.organizationName }}</p>
                  </div>
                  <div class="info-item">
                    <label>Nombre d'employés</label>
                    <p>{{ mission.employees || 'Non spécifié' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Secteur</label>
                    <p>{{ mission.sector || 'Non spécifié' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Type</label>
                    <p>{{ mission.questionnaireType === 'flash' ? 'Flash' : 'Maturité IA' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Adresse</label>
                    <p v-if="mission.organizationAddressLine || mission.organizationPostalCode || mission.organizationCity">
                      {{ mission.organizationAddressLine || '' }}
                      <span v-if="mission.organizationPostalCode || mission.organizationCity">
                        <br />
                        {{ mission.organizationPostalCode || '' }} {{ mission.organizationCity || '' }}
                      </span>
                      <span v-if="mission.organizationRegion">
                        <br />
                        {{ mission.organizationRegion }}
                      </span>
                    </p>
                    <p v-else>Non spécifié</p>
                  </div>
                  <div class="info-item">
                    <label>Téléphone</label>
                    <p>{{ mission.organizationPhone || 'Non spécifié' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Email</label>
                    <p>{{ mission.organizationEmail || 'Non spécifié' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Site web</label>
                    <p v-if="mission.organizationWebsite">
                      <a :href="mission.organizationWebsite" target="_blank">{{ mission.organizationWebsite }}</a>
                    </p>
                    <p v-else>Non spécifié</p>
                  </div>
                </div>
              </div>
              
              <!-- Coordonnées chef de projet -->
              <div v-if="mission.consultant" class="info-card">
                <div class="card-header-flex">
                  <h2 class="section-title section-title-teal">Chef de projet</h2>
                  <!-- Note: Chef de projet mission isn't directly in the wizard steps yet, 
                       but step 0 (Org) often contains general info. 
                       Assuming step 0 for simplicity if not dedicated step. -->
                  <button class="btn-edit-small" @click="startEditing(0)">Modifier</button>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Nom</label>
                    <p>{{ mission.consultant.firstName }} {{ mission.consultant.lastName }}</p>
                  </div>
                  <div v-if="mission.consultant.jobTitle" class="info-item">
                    <label>Poste</label>
                    <p>{{ mission.consultant.jobTitle }}</p>
                  </div>
                  <div class="info-item">
                    <label>Email</label>
                    <p>{{ mission.consultant.email }}</p>
                  </div>
                  <div v-if="mission.consultant.phone" class="info-item">
                    <label>Téléphone</label>
                    <p>{{ mission.consultant.phone }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Contact principal client -->
              <div v-if="mission.primaryContact" class="info-card">
                <div class="card-header-flex">
                  <h2 class="section-title section-title-purple">Contact principal client</h2>
                  <button class="btn-edit-small" @click="startEditing(2)">Modifier</button>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Nom</label>
                    <p>{{ mission.primaryContact.firstName }} {{ mission.primaryContact.lastName }}</p>
                  </div>
                  <div v-if="mission.primaryContact.role" class="info-item">
                    <label>Rôle</label>
                    <p>{{ mission.primaryContact.role }}</p>
                  </div>
                  <div class="info-item">
                    <label>Email</label>
                    <p>{{ mission.primaryContact.email }}</p>
                  </div>
                  <div v-if="mission.primaryContact.phone" class="info-item">
                    <label>Téléphone</label>
                    <p>{{ mission.primaryContact.phone }}</p>
                  </div>
                </div>
              </div>

              <!-- Services -->
              <div v-if="mission.services && mission.services.length > 0" class="info-card">
                <div class="card-header-flex">
                  <h2 class="section-title section-title-blue">Services</h2>
                  <button class="btn-edit-small" @click="startEditing(1)">Modifier / Ajouter</button>
                </div>
                <div class="services-mini-list">
                  <div v-for="service in mission.services" :key="service.id" class="service-pill-outline">
                    {{ service.name }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Chronologie -->
            <div v-if="activeTab === 'timeline'" class="tab-panel">
              <div class="panel-header">
                <div>
                  <h2>Chronologie du projet</h2>
                  <p class="panel-subtitle">Suivez les 11 étapes clés du projet et générez rapports ou emails à chaque jalon.</p>
                </div>
                <div class="timeline-total-days" v-if="totalWorkingDays !== null">
                  <span class="badge badge-purple">
                    Durée totale : {{ totalWorkingDays }} jours ouvrés
                  </span>
                </div>
              </div>

              <div class="timeline-container" v-if="projectTimeline.length">
                <div
                  v-for="(step, index) in projectTimeline"
                  :key="step.id"
                  :class="['timeline-step', step.status]"
                >
                  <div class="timeline-connector" v-if="index > 0"></div>

                  <div class="timeline-marker">
                    <div class="marker-circle">
                      <svg
                        v-if="step.status === 'completed'"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.667 5L7.5 14.167L3.333 10"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span v-else class="step-number">{{ index + 1 }}</span>
                    </div>
                  </div>

                  <div class="timeline-content">
                    <div class="step-header">
                      <div>
                        <h3>{{ step.title }}</h3>
                        <p class="step-description">{{ step.description }}</p>
                      </div>
                      <span :class="['step-status-badge', step.status]">
                        {{ getStatusLabel(step.status) }}
                      </span>
                    </div>

                    <div class="step-dates">
                      <div class="date-item">
                        <label>Date prévue :</label>
                        <input
                          type="date"
                          v-model="step.plannedDate"
                          @change="saveTimelineData()"
                          class="date-input"
                        />
                      </div>
                      <div class="date-item" v-if="step.status === 'completed'">
                        <label>Date réalisée :</label>
                        <input
                          type="date"
                          v-model="step.completedDate"
                          @change="saveTimelineData()"
                          class="date-input"
                        />
                      </div>
                      <div class="date-item working-days" v-if="step.status === 'completed' && index > 0 && projectTimeline[index-1].completedDate && step.completedDate">
                        <span class="badge" style="background-color: var(--gray-100); color: var(--gray-600); border: 1px solid var(--gray-200);">
                          +{{ calculateWorkingDays(projectTimeline[index-1].completedDate, step.completedDate) }} jours ouvrés
                        </span>
                      </div>
                    </div>

                    <div class="step-actions">
                      <button
                        v-if="step.actionType === 'report'"
                        @click="generateReport(step)"
                        class="btn-secondary"
                        :disabled="generatingPDF"
                      >
                        <svg v-if="!generatingPDF" width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 12V15C15 15.5304 14.7893 16.0391 14.4142 16.4142C14.0391 16.7893 13.5304 17 13 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M12 1V7H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M15 1L12 4L15 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span v-if="generatingPDF" class="spinner-small"></span>
                        {{ generatingPDF ? 'Génération...' : 'Générer le rapport' }}
                      </button>
                      <button
                        v-if="step.actionType === 'email'"
                        @click="sendEmail(step)"
                        class="btn-secondary"
                      >
                        Envoyer l'email
                      </button>
                      <button
                        v-if="step.status !== 'completed'"
                        @click="markStepCompleted(step)"
                        class="btn-primary"
                      >
                        Marquer comme complétée
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty">
                Aucune étape définie pour le moment.
              </div>
            </div>

            <!-- Contacts -->
            <div v-if="activeTab === 'contacts'" class="tab-panel">
              <div class="panel-header">
                <div>
                  <h2>Contacts de la mission</h2>
                  <p class="panel-subtitle">Gérer les contacts par service</p>
                </div>
              </div>
              <div v-if="mission.services && mission.services.length > 0" class="services-contacts-grid">
                <div v-for="service in mission.services" :key="service.id" class="service-section-compact">
                  <div class="service-header-compact">
                    <div class="service-title">
                      <h3>{{ service.name }}</h3>
                      <span class="service-code">{{ service.code }}</span>
                    </div>
                    <span class="badge badge-purple">{{ getContactsForService(service.id).length }}</span>
                  </div>
                  <div class="contacts-grid">
                    <div v-if="getContactsForService(service.id).length === 0" class="empty-contacts">
                      <p>Aucun contact assigné à ce service</p>
                    </div>
                    <div v-for="contact in getContactsForService(service.id)" :key="contact.id" class="contact-item-compact">
                      <div class="contact-name">{{ contact.firstName }} {{ contact.lastName }}</div>
                      <div class="contact-email">{{ contact.email }}</div>
                      <div v-if="contact.phone" class="contact-phone">{{ contact.phone }}</div>
                      <div v-if="contact.role" class="contact-role">{{ contact.role }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty">Aucun service</div>
            </div>

            <!-- Respondents -->
            <div v-if="activeTab === 'respondents'" class="tab-panel">
              <!-- Suivi en temps réel -->
              <div class="tracking-card">
                <h2>Suivi en temps réel</h2>
                <div class="tracking-stats">
                  <div class="tracking-stat">
                    <h3>Progression globale</h3>
                    <div class="progress-bar-container">
                      <div class="progress-bar" :style="{ width: getCompletionPercentage() + '%', background: getProgressColor(getCompletionPercentage()) }"></div>
                    </div>
                    <p class="progress-text">{{ completedSessions }} / {{ totalContacts }} répondants ({{ getCompletionPercentage() }}%)</p>
                  </div>
                  <div class="tracking-stat">
                    <h3>Par service</h3>
                    <div v-for="service in mission.services" :key="service.id" class="service-progress">
                      <div class="service-progress-header">
                        <router-link :to="`/results?mission=${mission.id}&service=${service.id}`" class="service-link">
                          <span>{{ service.name }}</span>
                        </router-link>
                        <span class="progress-percentage">{{ getServiceCompletionPercentage(service.id) }}%</span>
                      </div>
                      <div class="progress-bar-container small">
                        <div class="progress-bar" :style="{ width: getServiceCompletionPercentage(service.id) + '%', background: getProgressColor(getServiceCompletionPercentage(service.id)) }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions d'envoi -->
              <div class="send-actions-card">
                <h2>Envoyer les questionnaires</h2>
                <div class="send-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Template d'email *</label>
                      <select v-model="emailTemplate" class="form-input">
                        <option value="">Choisir un template...</option>
                        <option v-for="template in emailTemplates" :key="template.id" :value="template.id">
                          {{ template.name }}
                        </option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Date limite de réponse *</label>
                      <input v-model="deadlineDate" type="date" class="form-input" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Message personnalisé (optionnel)</label>
                    <textarea v-model="customMessage" class="form-input" rows="3" placeholder="Ajoutez un message personnalisé..."></textarea>
                  </div>
                  <div class="form-group">
                    <label>Template de signature</label>
                    <select v-model="signatureTemplate" class="form-input">
                      <option value="">Signature par défaut</option>
                      <option v-for="sigTemplate in signatureTemplates" :key="sigTemplate.id" :value="sigTemplate.id">
                        {{ sigTemplate.name }}{{ sigTemplate.is_default ? ' (Par défaut)' : '' }}
                      </option>
                    </select>
                    <button @click="showSignatureManager = true" type="button" class="btn-link" style="margin-top: 8px; font-size: 0.875rem;">
                      Gérer les templates de signatures
                    </button>
                  </div>
                  <div class="form-group">
                    <label>Sélectionner les contacts</label>
                    <div class="contacts-selection">
                      <div 
                        @click="toggleAllContacts" 
                        style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; cursor: pointer; user-select: none;"
                      >
                        <div 
                          style="width: 20px; height: 20px; border-radius: 4px; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; background-color: white; transition: all 0.2s;"
                          :style="allContactsSelected ? 'background-color: #3b82f6; border-color: #3b82f6;' : ''"
                        >
                          <svg v-if="allContactsSelected" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                            <path d="M10 3L4.5 8.5L2 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                        <span style="font-weight: 600; font-size: 1rem; color: #111827; line-height: 1.5;">Sélectionner tous les contacts</span>
                      </div>
                      <div class="contacts-list-select">
                        <div v-for="contact in mission.contacts" :key="contact.id" class="contact-select-item">
                          <label class="checkbox-label contact-checkbox-label">
                            <div class="contact-info-wrapper">
                              <div class="checkbox-row">
                                <input type="checkbox" :value="contact.id" v-model="selectedContacts" />
                                <span class="contact-name-email" style="font-weight: 600; font-size: 1rem;">{{ contact.firstName }} {{ contact.lastName }} <span style="font-weight:normal; color:#666;">({{ contact.email }})</span></span>
                                <span v-if="hasResponded(contact.id)" class="badge badge-success">A RÉPONDU</span>
                                <span v-else class="badge badge-warning">EN ATTENTE</span>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="form-actions">
                    <button @click="previewEmail" :disabled="!emailTemplate || !deadlineDate" class="btn-secondary">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 9C1 13.4183 4.58172 17 9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M9 5V9L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                      Aperçu du message
                    </button>
                  </div>
                </div>
              </div>


            </div>

            <!-- Links -->
            <div v-if="activeTab === 'links'" class="tab-panel">
              <div class="panel-header">
                <div>
                  <h2>Liens par service</h2>
                  <p class="panel-subtitle">Partagez ces liens avec les équipes de chaque service</p>
                </div>
              </div>
              <div v-if="mission.services && mission.services.length > 0" class="links-list">
                <div v-for="(service, index) in mission.services" :key="service.id" class="link-card">
                  <div class="link-header">
                    <h3 :class="['service-name-colored', 'service-color-' + String(Number(index) % 4)]">{{ service.name }}</h3>
                    <span class="badge badge-purple">{{ getCompletedForService(service.id) }}/{{ getTotalForService(service.id) }} complétés</span>
                  </div>
                  
                  <!-- Lien du service pour copier/transmettre -->
                  <div class="service-link-section">
                    <label class="link-label">Lien du questionnaire :</label>
                    <div class="link-input-group">
                      <input 
                        type="text" 
                        :value="getFullLink(service.uniqueLink)" 
                        readonly 
                        class="link-input"
                        :id="`link-${service.id}`"
                      />
                      <button @click="copyLink(getFullLink(service.uniqueLink))" class="btn-icon" :title="'Copier le lien'">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 3H11C11.5523 3 12 3.44772 12 4V12C12 12.5523 11.5523 13 11 13H5C4.44772 13 4 12.5523 4 12V4C4 3.44772 4.44772 3 5 3Z" stroke="currentColor" stroke-width="1.5"/>
                          <path d="M2 5H1C0.447715 5 0 5.44772 0 6V14C0 14.5523 0.447715 15 1 15H9C9.55228 15 10 14.5523 10 14V13" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        Copier le lien
                      </button>
                    </div>
                  </div>

                  <!-- Liste des contacts avec bouton d'accès -->
                  <div class="contacts-list">
                    <label class="link-label">Contacts :</label>
                    <div v-for="contact in getContactsForService(service.id)" :key="contact.id" class="contact-item">
                      <div class="contact-info">
                        <span class="contact-name">{{ contact.firstName }} {{ contact.lastName }}</span>
                        <span v-if="contact.role" class="contact-role">{{ contact.role }}</span>
                        <span v-if="contact.email" class="contact-email">{{ contact.email }}</span>
                      </div>
                      <a :href="getFullLink(service.uniqueLink)" target="_blank" class="btn-secondary btn-small">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V9M10 1H15M15 1V6M15 1L6 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Accéder au questionnaire
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty">Aucun service</div>
            </div>



            <!-- Reports -->
            <div v-if="activeTab === 'reports'" class="tab-panel">
              <div class="panel-header">
                <div>
                  <h2>Rapports</h2>
                  <p class="panel-subtitle">Générez et téléchargez les rapports de diagnostic</p>
                </div>
              </div>
              <div class="reports-actions">
                <router-link :to="`/report/${mission.id}`" class="btn-primary">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3V13H13V3H3ZM5 5H11V11H5V5Z" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  Générer le rapport
                </router-link>
              </div>
            </div>

            <!-- Emails -->
            <div v-if="activeTab === 'emails'" class="tab-panel">
              <div class="email-section">
                <h2>Envoyer un email</h2>
                <p class="panel-subtitle">Sélectionnez un template d'email pour communiquer avec les contacts de la mission</p>
                <div class="email-form">
                  <div class="form-group">
                    <label>Template d'email *</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <select v-model="emailTemplate" class="form-input" style="flex: 1;">
                        <option value="">Choisir un template...</option>
                        <option v-for="template in emailTemplates" :key="template.id" :value="template.id">
                          {{ template.name }}
                        </option>
                      </select>
                      <button @click="showEmailTemplateManager = true" type="button" class="btn-secondary" style="white-space: nowrap;">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 2V14M2 8H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        Gérer les templates
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Date limite de réponse *</label>
                    <input v-model="deadlineDate" type="date" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label>Message personnalisé (optionnel)</label>
                    <textarea v-model="customMessage" class="form-input" rows="4" placeholder="Ajoutez un message personnalisé qui sera inclus dans l'email..."></textarea>
                  </div>
                  <div class="form-group">
                    <label>Template de signature</label>
                    <select v-model="signatureTemplate" class="form-input">
                      <option value="">Signature par défaut</option>
                      <option v-for="sigTemplate in signatureTemplates" :key="sigTemplate.id" :value="sigTemplate.id">
                        {{ sigTemplate.name }}{{ sigTemplate.is_default ? ' (Par défaut)' : '' }}
                      </option>
                    </select>
                    <button @click="showSignatureManager = true" type="button" class="btn-link" style="margin-top: 8px; font-size: 0.875rem;">
                      Gérer les templates de signatures
                    </button>
                  </div>
                  <div class="form-group">
                    <label>Sélectionner les contacts</label>
                    <div class="contacts-selection">
                      <label class="checkbox-label select-all-label">
                        <input type="checkbox" @change="toggleAllContacts" :checked="allContactsSelected" />
                        <span>Sélectionner tous les contacts</span>
                      </label>
                      <div class="contacts-list-select">
                        <div
                          v-for="contact in sortedContacts"
                          :key="contact.id"
                          class="contact-select-item"
                          :class="{
                            'contact-primary': isPrimaryContact(contact),
                            'contact-referent': !isPrimaryContact(contact) && isServiceReferent(contact)
                          }"
                        >
                          <label class="checkbox-label contact-checkbox-label">
                            <div class="contact-info-wrapper">
                              <div class="checkbox-row">
                                <input type="checkbox" :value="contact.id" v-model="selectedContacts" />
                                <span class="contact-name-email" style="font-weight: 600; font-size: 1rem;">{{ contact.firstName }} {{ contact.lastName }} <span style="font-weight:normal; color:#666;">({{ contact.email }})</span></span>
                                <span v-if="isPrimaryContact(contact)" class="badge badge-primary-contact">PRINCIPAL</span>
                                <span v-else-if="isServiceReferent(contact)" class="badge badge-referent-contact">RÉFÉRENT SERVICE</span>
                                <span v-if="hasResponded(contact.id)" class="badge badge-success">A RÉPONDU</span>
                                <span v-else class="badge badge-warning">EN ATTENTE</span>
                              </div>
                              <div style="padding-left: 32px; margin-top: 4px;">
                                <div v-if="contact.role || contact.phone" style="font-size: 0.875rem; color: #6b7280;">
                                  <span v-if="contact.role">{{ contact.role }}</span>
                                  <span v-if="contact.role && contact.phone"> • </span>
                                  <span v-if="contact.phone">{{ contact.phone }}</span>
                                </div>
                                <div v-if="contact.serviceId" style="font-size: 0.875rem; color: #6b7280; margin-top: 2px;">
                                  Service: {{ getServiceName(contact.serviceId) }}
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Pièce jointe (optionnel)</label>
                    <div class="file-attachment-input">
                      <input type="file" @change="handleFileChange" class="form-input" id="email-attachment" />
                      <p v-if="attachedFile" class="file-info">
                        <strong>Fichier :</strong> {{ attachedFile.name }} ({{ Math.round(attachedFile.size / 1024) }} KB)
                      </p>
                    </div>
                  </div>
                  <div class="form-actions">
                    <button @click="previewEmail" :disabled="!emailTemplate || !deadlineDate" class="btn-secondary">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 9C1 13.4183 4.58172 17 9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M9 5V9L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                      Aperçu du message
                    </button>
                    <button @click="sendQuestionnaires" :disabled="!canSendEmails" class="btn-primary">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 3L7.5 8.5M14 1L9.5 5.5M2 3L6 13L9.5 8.5M14 1L10 11L9.5 8.5M2 3H6M14 1H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Envoyer les questionnaires
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="email-section">
                <h2>Historique des emails</h2>
                <p class="panel-subtitle">{{ emailHistory.length }} email(s) envoyé(s) pour cette mission</p>
                <div v-if="emailHistory.length === 0" class="empty-state">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 16H56V48H8V16ZM12 20L32 36L52 20M12 44L20 36M52 44L44 36" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <p>Aucun email envoyé pour le moment</p>
                </div>
                <div v-else class="email-history-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Destinataire</th>
                        <th>Objet</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="log in emailHistory" :key="log.id">
                        <td>{{ log.sentAt ? formatDateShort(log.sentAt) : '—' }}</td>
                        <td>{{ log.recipientName || '—' }}</td>
                        <td>{{ log.subject || log.templateName || '—' }}</td>
                        <td>
                          <span :class="['badge', log.status === 'sent' ? 'badge-success' : log.status === 'failed' ? 'badge-danger' : 'badge-warning']">
                            {{ log.status === 'sent' ? 'Envoyé' : log.status === 'failed' ? 'Échoué' : log.status }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal d'aperçu email -->
    <div v-if="showEmailPreview" class="modal-overlay" @click="showEmailPreview = false">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h2>Aperçu du message</h2>
          <button @click="showEmailPreview = false" class="btn-close-modal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="emailPreview" class="email-preview">
            <div class="preview-field">
              <label>Destinataire :</label>
              <p>{{ emailPreview.to }}</p>
            </div>
            <div class="preview-field">
              <label>Objet :</label>
              <p>{{ emailPreview.subject }}</p>
            </div>
            <div class="preview-field">
              <label>Message :</label>
              <div class="preview-html" v-html="emailPreview.body"></div>
            </div>
            <div v-if="attachedFile" class="preview-field">
              <label>Pièce jointe :</label>
              <p>{{ attachedFile.name }} ({{ Math.round(attachedFile.size / 1024) }} KB)</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showEmailPreview = false" class="btn-secondary">Fermer</button>
          <button @click="confirmAndSend" :disabled="!canSendEmails" class="btn-primary">
            Confirmer et envoyer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de gestion des signatures -->
    <div v-if="showSignatureManager" class="modal-overlay" @click="showSignatureManager = false">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h2>Gérer les templates de signatures</h2>
          <button @click="showSignatureManager = false" class="btn-close-modal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="signature-manager">
            <div class="signature-list">
              <h3>Templates existants</h3>
              <div v-for="sigTemplate in signatureTemplates" :key="sigTemplate.id" class="signature-item">
                <div class="signature-info">
                  <strong>{{ sigTemplate.name }}</strong>
                  <span v-if="sigTemplate.is_default" class="badge badge-success">Par défaut</span>
                </div>
                <div class="signature-preview" v-html="sigTemplate.html_content"></div>
              </div>
            </div>
            <div class="signature-form">
              <h3>Créer un nouveau template</h3>
              <div class="form-group">
                <label>Nom du template *</label>
                <input v-model="newSignatureName" type="text" class="form-input" placeholder="Ex: Signature Images & Réseaux" />
              </div>
              <div class="form-group">
                <label>Contenu HTML *</label>
                <textarea v-model="newSignatureContent" class="form-input signature-textarea" rows="12" placeholder="<p>Cordialement,<br><strong>Nom</strong><br>Poste</p>"></textarea>
                <small>Vous pouvez utiliser du HTML pour formater la signature</small>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="newSignatureIsDefault" />
                  <span>Définir comme signature par défaut</span>
                </label>
              </div>
              <button @click="createSignatureTemplate" class="btn-primary">Créer le template</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showSignatureManager = false" class="btn-secondary">Fermer</button>
        </div>
      </div>
    </div>

    <!-- Modal de gestion des templates d'email -->
    <div v-if="showEmailTemplateManager" class="modal-overlay" @click="showEmailTemplateManager = false">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h2>Gérer les templates d'email</h2>
          <button @click="showEmailTemplateManager = false" class="btn-close-modal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="signature-manager">
            <div class="signature-list">
              <h3>Templates existants</h3>
              <div v-for="template in emailTemplates" :key="template.id" class="signature-item">
                <div class="signature-info">
                  <strong>{{ template.name }}</strong>
                </div>
                <div class="signature-preview">
                  <p><strong>Objet:</strong> {{ template.subject }}</p>
                  <div v-html="template.body"></div>
                </div>
              </div>
            </div>
            <div class="signature-form">
              <h3>Créer un nouveau template</h3>
              <div class="form-group">
                <label>Nom du template *</label>
                <input v-model="newEmailTemplateName" type="text" class="form-input" placeholder="Ex: Invitation personnalisée" />
              </div>
              <div class="form-group">
                <label>Objet de l'email *</label>
                <input v-model="newEmailTemplateSubject" type="text" class="form-input" placeholder="Ex: Invitation - {{organization_name}}" />
                <small v-pre>Vous pouvez utiliser {{variable}} pour les variables dynamiques</small>
              </div>
              <div class="form-group">
                <label>Corps de l'email (HTML) *</label>
                <textarea v-model="newEmailTemplateBody" class="form-input signature-textarea" rows="12" placeholder="<h2>Bonjour {{contact_first_name}},</h2><p>...</p>"></textarea>
                <small v-pre>Variables disponibles: {{contact_first_name}}, {{contact_last_name}}, {{organization_name}}, {{questionnaire_link}}, {{deadline_date}}, {{signature}}</small>
              </div>
              <button @click="createEmailTemplate" class="btn-primary">Créer le template</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showEmailTemplateManager = false" class="btn-secondary">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, reactive } from 'vue'
import { calculateWorkingDays } from '../../utils/formatters'

const props = defineProps<{ params: any; query: any }>()
const router = inject('router') as any

// État de la mission
const mission = ref<any>(null)
const loading = ref(true)
const error = ref('')
const projectTimeline = ref<any[]>([])
const sessions = ref<any[]>([])
const generatingPDF = ref(false)

// Onglet actif
const activeTab = ref('overview')

// Formulaire d'envoi d'emails
const selectedContacts = ref<number[]>([])
const emailTemplate = ref('')
const deadlineDate = ref('')
const customMessage = ref('')
const signatureTemplate = ref('')
const emailTemplates = ref<any[]>([])
const signatureTemplates = ref<any[]>([])
const attachedFile = ref<File | null>(null)
const attachedFileData = ref<string | null>(null)

// Prévisualisation d'email
const showEmailPreview = ref(false)
const emailPreview = ref<any>(null)

// Gestion des templates
const showEmailTemplateManager = ref(false)
const showSignatureManager = ref(false)

// Mode édition
const isEditing = ref(false)
const submitting = ref(false)
const currentEditStep = ref(0)
const newServiceName = ref('')
const serviceCreated = ref(false)

// Formulaire d'édition
const editForm = reactive({
  organizationName: '',
  sector: '',
  employees: null as number | null,
  questionnaireType: 'flash' as 'flash' | 'full',
  status: 'preparation',
  organizationAddressLine: '',
  organizationPostalCode: '',
  organizationCity: '',
  organizationRegion: '',
  organizationPhone: '',
  organizationEmail: '',
  organizationWebsite: '',
  services: [] as any[],
  contacts: [] as any[]
})

const editSteps = [
  { label: 'Organisation' },
  { label: 'Services' },
  { label: 'Contacts' },
  { label: 'Confirmation' }
]

// Modal Nouveau Template Signature
const newSignatureName = ref('')
const newSignatureContent = ref('')
const newSignatureIsDefault = ref(false)

// Modal Nouveau Template Email
const newEmailTemplateName = ref('')
const newEmailTemplateSubject = ref('')
const newEmailTemplateBody = ref('')

// Sélection de sessions pour suppression groupée
const selectedSessions = ref<number[]>([])

// Envoi emails : état animé
const isSending = ref(false)
const sendDone = ref(false)
const emailHistory = ref<any[]>([])

// Fonctions initialisation
function initializeTimeline() {
  const steps = [
    { id: 1, title: 'Cadrage de la mission', description: 'Définition des objectifs et du périmètre', status: 'completed', actionType: null },
    { id: 2, title: 'Lancement du diagnostic', description: 'Réunion de lancement avec les parties prenantes', status: 'pending', actionType: 'email' },
    { id: 3, title: 'Recueil des données', description: 'Envoi des questionnaires aux collaborateurs', status: 'pending', actionType: 'email' },
    { id: 4, title: 'Analyse des résultats', description: 'Traitement et interprétation des données recueillies', status: 'pending', actionType: null },
    { id: 5, title: 'Génération du rapport synthétique', description: 'Création de la synthèse du diagnostic', status: 'pending', actionType: 'report' },
    { id: 6, title: 'Présentation de la synthèse', description: 'Restitution des premiers résultats au client', status: 'pending', actionType: 'email' },
    { id: 7, title: 'Génération du rapport détaillé', description: 'Production du rapport complet d\'analyse', status: 'pending', actionType: 'report' },
    { id: 8, title: 'Présentation du rapport détaillé', description: 'Restitution finale approfondie', status: 'pending', actionType: 'email' },
    { id: 9, title: 'Génération du guide atelier', description: 'Préparation du support pour l\'atelier plan d\'action', status: 'pending', actionType: 'report' },
    { id: 10, title: 'Plan d\'actions', description: 'Définition de la feuille de route transformation IA', status: 'pending', actionType: 'email' },
    { id: 11, title: 'Clôture de la mission', description: 'Bilan final et fin de mission', status: 'pending', actionType: null }
  ]
  projectTimeline.value = steps
}

async function loadTimelineData() {
  if (!mission.value) return
  
  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`/api/missions/${props.params.id}/timeline-steps`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.ok) {
      const savedSteps = await response.json()
      if (savedSteps && savedSteps.length > 0) {
        savedSteps.forEach((savedStep: any) => {
          const step = projectTimeline.value.find(s => s.id === savedStep.step_number)
          if (step) {
            step.status = savedStep.status
            step.plannedDate = savedStep.planned_date
            step.completedDate = savedStep.completed_date
          }
        })
      }
    }
  } catch (error) {
    console.error('Error loading timeline data:', error)
  }
}

async function generateReport(step: any) {
  if (generatingPDF.value) return
  
  try {
    const missionId = mission.value?.id
    if (!missionId) {
      alert("ID de mission introuvable.")
      return
    }

    generatingPDF.value = true
    
    // Déterminer le mode selon l'étape
    let mode = 'synthetic'
    if (step.id === 7) mode = 'detailed'
    if (step.id === 9) mode = 'workshop'
    
    const response = await fetch(`/api/export/pdf?mission=${missionId}&mode=${mode}`)
    
    if (!response.ok) {
       const text = await response.text()
       throw new Error(text || 'Erreur serveur')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const organizationName = mission.value?.organizationName || 'Organisation'
    const fileName = mode === 'synthetic' ? 'Rapport_Synthetique' : mode === 'detailed' ? 'Rapport_Complet' : 'Guide_Atelier'
    a.download = `${fileName}_${organizationName.replace(/[^a-z0-9]/gi, '_')}.pdf`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error generating report:', error)
    alert(`Une erreur est survenue lors de la génération du rapport : ${(error as Error).message}`)
  } finally {
    generatingPDF.value = false
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'completed': return 'Complétée'
    case 'in-progress': return 'En cours'
    case 'pending': return 'À faire'
    default: return status
  }
}

async function markStepCompleted(step: any) {
  step.status = 'completed'
  step.completedDate = new Date().toISOString().split('T')[0]
  await saveTimelineData()
}

function sendEmail(step: any) {
  activeTab.value = 'emails'
  alert(`Préparation de l'email pour l'étape: ${step.title}`)
}
async function saveTimelineData() {
  if (!mission.value) return
  
  try {
    const token = localStorage.getItem('auth_token')
    const stepType = mission.value.questionnaireType
    
    // Sauvegarder toutes les étapes modifiées
    for (const step of projectTimeline.value) {
      await fetch(`/api/missions/${props.params.id}/timeline-steps/${step.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: step.status,
          plannedDate: step.plannedDate || null,
          completedDate: step.completedDate || null,
          stepType: stepType
        })
      })
    }
  } catch (error) {
    console.error('Error saving timeline data:', error)
  }
}

const tabs = [
  { id: 'overview', label: 'Vue d\'ensemble', color: 'orange' },
  { id: 'timeline', label: 'Chronologie', color: 'teal' },
  { id: 'contacts', label: 'Contacts', color: 'purple' },
  { id: 'emails', label: 'Emails', color: 'blue' },
  { id: 'respondents', label: 'Répondants', color: 'blue' },
  { id: 'links', label: 'Liens', color: 'orange' },
  { id: 'reports', label: 'Rapports', color: 'purple' }
]

const completedSessions = computed(() => 
  sessions.value.filter(s => s.completedAt).length
)

const currentStep = computed(() => {
  if (!projectTimeline.value || projectTimeline.value.length === 0) return null
  return projectTimeline.value.find(s => s.status === 'in-progress') || 
         projectTimeline.value.find(s => s.status === 'pending') ||
         projectTimeline.value[projectTimeline.value.length - 1]
})

const totalWorkingDays = computed(() => {
  if (!projectTimeline.value || projectTimeline.value.length === 0) return null
  
  const completedSteps = projectTimeline.value.filter(s => s.status === 'completed' && s.completedDate)
  if (completedSteps.length < 2) return null
  
  // From mission creation to the last completed step
  const firstDate = mission.value?.createdAt || completedSteps[0].completedDate
  const lastDate = completedSteps[completedSteps.length - 1].completedDate
  
  return calculateWorkingDays(firstDate, lastDate)
})

let sessionsPollInterval: number | null = null

onMounted(async () => {
  await loadMission()
  await loadSessions()
  await loadEmailTemplates()
  await loadSignatureTemplates()
  await loadEmailHistory()

  // Pré-charger les résultats de la mission en arrière-plan pour éviter
  // que l'utilisateur attende longtemps lors du premier clic sur "Résultats"
  // ou "Détails par service".
  preloadResults().catch((err) => {
    console.error('[MissionDetails] Error preloading results:', err)
  })
  
  // Poll for session updates every 5 seconds for real-time tracking
  sessionsPollInterval = window.setInterval(async () => {
    await loadSessions()
  }, 5000)
})

onUnmounted(() => {
  if (sessionsPollInterval !== null) {
    clearInterval(sessionsPollInterval)
    sessionsPollInterval = null
  }
})

async function preloadResults() {
  try {
    const missionId = props.params.id
    if (!missionId) return

    const url = `/results?mission=${missionId}`

    // Utiliser la même origine que le front ; cette requête déclenche
    // en réalité l'appel serveur `/api/results?mission=...` via la page
    // Results.vue, ce qui "réchauffe" les calculs et le cache DB.
    // On ne bloque pas l'interface : pas de await dans onMounted.
    await fetch(url, {
      method: 'GET',
      // On évite de polluer le cache navigateur : l'objectif est surtout
      // de réchauffer le serveur et le cache SQLite.
      cache: 'no-cache'
    })
  } catch (err) {
    console.error('[MissionDetails] Failed to preload mission results', err)
  }
}

async function loadMission() {
  loading.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`/api/missions/${props.params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erreur lors du chargement')
    }

    const missionData = await response.json()
    console.log('Mission loaded:', missionData)
    console.log('Address fields:', {
      addressLine: missionData.organizationAddressLine,
      postalCode: missionData.organizationPostalCode,
      city: missionData.organizationCity,
      region: missionData.organizationRegion
    })
    console.log('Contacts loaded:', missionData.contacts?.length || 0, 'contacts')
    if (missionData.contacts && missionData.contacts.length > 0) {
      console.log('Sample contact:', missionData.contacts[0])
      console.log('All contacts serviceIds:', missionData.contacts.map((c: any) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, serviceId: c.serviceId || c.service_id })))
      // Log contacts by service
      const contactsByService: Record<number, number> = {}
      missionData.contacts.forEach((c: any) => {
        const serviceId = c.serviceId || c.service_id
        if (serviceId) {
          contactsByService[serviceId] = (contactsByService[serviceId] || 0) + 1
        }
      })
      console.log('[loadMission] Contacts by service:', contactsByService)
    }
    console.log('Services loaded:', missionData.services?.length || 0, 'services')
    if (missionData.services && missionData.services.length > 0) {
      console.log('Sample service:', missionData.services[0])
      console.log('All service IDs:', missionData.services.map((s: any) => s.id))
    }
    mission.value = missionData
    // Initialiser la chronologie après le chargement de la mission
    initializeTimeline()
    console.log('Timeline initialized, steps count:', projectTimeline.value.length)
    // Charger les validations d'étapes après initialisation
    await loadTimelineData()
    console.log('Timeline data loaded, steps count:', projectTimeline.value.length)
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadSessions() {
  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`/api/missions/${props.params.id}/sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const loadedSessions = await response.json()
      sessions.value = loadedSessions
      console.log(`[loadSessions] Loaded ${loadedSessions.length} sessions`)
      // Log sessions by service
      const byService: Record<number, number> = {}
      loadedSessions.forEach((s: any) => {
        const serviceId = s.serviceId || s.service_id
        if (serviceId) {
          byService[serviceId] = (byService[serviceId] || 0) + 1
        }
      })
      console.log('[loadSessions] Sessions by service:', byService)
    }
  } catch (err) {
    console.error('Error loading sessions:', err)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('fr-FR')
}

function getFullLink(link: string) {
  // If link already contains http:// or https://, return as is
  if (link.startsWith('http://') || link.startsWith('https://')) {
    return link
  }
  // Otherwise, prepend the current origin
  return `${window.location.origin}${link}`
}

function copyLink(link: string) {
  const fullLink = getFullLink(link)
  navigator.clipboard.writeText(fullLink)
  alert('Lien copié dans le presse-papiers')
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}



function getContactsForService(serviceId: number) {
  if (!mission.value?.contacts) {
    console.log('No contacts in mission')
    return []
  }
  const contacts = mission.value.contacts.filter((c: any) => {
    const contactServiceId = (c.serviceId !== undefined && c.serviceId !== null) ? c.serviceId : c.service_id
    // Loose comparison for both ID types
    return String(contactServiceId) == String(serviceId)
  })
  return contacts
}

function getServiceName(serviceId: number | null) {
  if (!serviceId || !mission.value?.services) return 'Non assigné'
  const service = mission.value.services.find((s: any) => s.id === serviceId)
  return service ? service.name : 'Non assigné'
}



function getCompletedForService(serviceId: any) {
  // Count completed sessions for this service
  return sessions.value.filter(s => {
    const sServiceId = (s.serviceId !== undefined && s.serviceId !== null) ? s.serviceId : s.service_id
    return String(sServiceId) == String(serviceId) && s.completedAt
  }).length
}

function getTotalForService(serviceId: number) {
  // Count total contacts for this service
  const serviceContacts = getContactsForService(serviceId)
  return serviceContacts.length
}

function startEditing(step = 0) {
  if (!mission.value) return
  
  // Initialize edit form with current mission data
  editForm.organizationName = mission.value.organizationName
  editForm.sector = mission.value.sector || ''
  editForm.employees = mission.value.employees
  editForm.questionnaireType = mission.value.questionnaireType
  editForm.status = mission.value.status
  editForm.organizationAddressLine = mission.value.organizationAddressLine || ''
  editForm.organizationPostalCode = mission.value.organizationPostalCode || ''
  editForm.organizationCity = mission.value.organizationCity || ''
  editForm.organizationRegion = mission.value.organizationRegion || ''
  editForm.organizationPhone = mission.value.organizationPhone || ''
  editForm.organizationEmail = mission.value.organizationEmail || ''
  editForm.organizationWebsite = mission.value.organizationWebsite || ''
  editForm.services = (mission.value.services || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    code: s.code
  }))
  // Map contacts with their service IDs (not indices)
  editForm.contacts = (mission.value.contacts || []).map((c: any) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone || '',
    role: c.role || '',
    serviceId: c.serviceId, // Keep the actual service ID
    isPrimary: c.isPrimary || false,
    isReferent: c.isReferent || false
  }))
  
  currentEditStep.value = step
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  currentEditStep.value = 0
  newServiceName.value = ''
  serviceCreated.value = false
}

function nextEditStep() {
  if (currentEditStep.value < editSteps.length - 1) {
    currentEditStep.value++
  }
}

function previousEditStep() {
  if (currentEditStep.value > 0) {
    currentEditStep.value--
  }
}

function createService() {
  const name = newServiceName.value.trim()
  if (!name) return
  
  editForm.services.push({ name })
  newServiceName.value = ''
  serviceCreated.value = true
  
  setTimeout(() => {
    serviceCreated.value = false
  }, 2000)
}

function removeService(index: number) {
  editForm.services.splice(index, 1)
}

function addContact() {
  editForm.contacts.push({
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
  editForm.contacts.splice(index, 1)
}

async function handleSave() {
  submitting.value = true

  try {
    const token = localStorage.getItem('auth_token')
    
    // Prepare services (keep IDs for existing, new ones won't have ID)
    const services = editForm.services.map(s => ({ 
      id: s.id, // Keep ID if exists (for updates)
      name: s.name,
      code: s.code
    }))
    
    // Map contacts: for existing contacts, keep serviceId as is (it's already the service ID)
    // For new contacts, we need to map serviceId to the service array index
    // But since we're updating, we should keep the actual service IDs
    const contacts = editForm.contacts.map(c => {
      // If contact has an ID (existing), keep serviceId as is
      // If contact is new, we need to find the service index
      let mappedServiceId = c.serviceId
      if (c.serviceId !== null && c.serviceId !== undefined && !c.id) {
        // New contact: find service index
        const serviceIndex = services.findIndex(s => s.id === c.serviceId)
        if (serviceIndex !== -1) {
          mappedServiceId = serviceIndex
        } else {
          mappedServiceId = null
        }
      }
      
      return {
        id: c.id, // Keep ID if exists (for updates)
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone || null,
        role: c.role || null,
        serviceId: mappedServiceId,
        isPrimary: c.isPrimary || false,
        isReferent: c.isReferent || false
      }
    })

    const payload = {
      organizationName: editForm.organizationName,
      sector: editForm.sector || null,
      employees: editForm.employees || null,
      questionnaireType: editForm.questionnaireType,
      status: editForm.status,
      organizationAddressLine: editForm.organizationAddressLine || null,
      organizationPostalCode: editForm.organizationPostalCode || null,
      organizationCity: editForm.organizationCity || null,
      organizationRegion: editForm.organizationRegion || null,
      organizationPhone: editForm.organizationPhone || null,
      organizationEmail: editForm.organizationEmail || null,
      organizationWebsite: editForm.organizationWebsite || null,
      services,
      contacts
    }
    console.log('Saving mission with payload:', payload)
    
    const response = await fetch(`/api/missions/${props.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la mise à jour')
    }

    // Reload mission data
    await loadMission()
    isEditing.value = false
    alert('Mission mise à jour avec succès')
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la mise à jour de la mission')
  } finally {
    submitting.value = false
  }
}

function getCompletionPercentage(): number {
  if (!mission.value?.contacts || mission.value.contacts.length === 0) return 0
  const total = mission.value.contacts.length
  const completed = sessions.value.filter(s => s.completedAt).length
  return Math.round((completed / total) * 100)
}

function getProgressColor(percentage: number): string {
  if (percentage >= 0 && percentage <= 25) return '#ef4444' // rouge
  if (percentage >= 26 && percentage <= 50) return '#f97316' // orange
  if (percentage >= 51 && percentage <= 100) return '#22c55e' // vert
  return '#3b82f6' // bleu par défaut
}



// Trier les contacts : contact principal en premier, puis référents par service
const sortedContacts = computed(() => {
  if (!mission.value?.contacts) return []
  const contacts = [...mission.value.contacts]
  // Séparer les contacts : principal, référents, autres
  const primaryContacts = contacts.filter((c: any) => isPrimaryContact(c))
  const referentContacts = contacts.filter((c: any) => !isPrimaryContact(c) && isServiceReferent(c))
  const otherContacts = contacts.filter((c: any) => !isPrimaryContact(c) && !isServiceReferent(c))
  // Retourner : contact principal, puis référents, puis autres
  return [...primaryContacts, ...referentContacts, ...otherContacts]
})

function isPrimaryContact(contact: any): boolean {
  if (!contact) return false
  // Uniquement le contact principal de la mission (celui défini dans mission.primaryContact)
  if (mission.value?.primaryContact && contact.id === mission.value.primaryContact.id) {
    return true
  }
  return false
}

function isServiceReferent(contact: any): boolean {
  if (!contact) return false
  // Référent de service : case cochée dans la fiche contact
  return contact.isReferent === true || contact.is_referent === true
}

function getServiceCompletionPercentage(serviceId: number): number {
  const serviceContacts = mission.value?.contacts?.filter((c: any) => {
    // Handle both serviceId and service_id (from API)
    const contactServiceId = c.serviceId !== undefined ? c.serviceId : c.service_id
    return contactServiceId === serviceId
  }) || []
  if (serviceContacts.length === 0) {
    console.log(`[getServiceCompletionPercentage] Service ${serviceId}: No contacts found`)
    return 0
  }
  const serviceSessions = sessions.value.filter(s => {
    const sessionServiceId = (s.serviceId !== undefined && s.serviceId !== null) ? s.serviceId : s.service_id
    return String(sessionServiceId) == String(serviceId) && s.completedAt
  })
  const percentage = Math.round((serviceSessions.length / serviceContacts.length) * 100)
  console.log(`[getServiceCompletionPercentage] Service ${serviceId}: ${serviceSessions.length}/${serviceContacts.length} = ${percentage}%`)
  return percentage
}

const totalContacts = computed(() => mission.value?.contacts?.length || 0)

function getContactSession(contactId: number) {
  const contact = mission.value?.contacts?.find((c: any) => c.id === contactId)
  if (!contact) return null

  // 1. Chercher d'abord une session avec un contactId / contact_id exact
  const exactSession = sessions.value.find(s => s.contactId === contactId || s.contact_id === contactId)
  if (exactSession) return exactSession

  // 2. Si non trouvé, on tombe sur le système de slot pour les anciennes sessions sans contact_id
  const contactServiceId = (contact.serviceId !== undefined && contact.serviceId !== null) ? contact.serviceId : contact.service_id
  
  // Les vieilles sessions du service
  const legacySessions = sessions.value.filter(s => {
    const sServiceId = (s.serviceId !== undefined && s.serviceId !== null) ? s.serviceId : s.service_id
    const hasContact = s.contactId || s.contact_id
    return !hasContact && String(sServiceId) === String(contactServiceId)
  }).sort((a, b) => {
    // Les terminées d'abord
    if (a.completedAt && !b.completedAt) return -1
    if (!a.completedAt && b.completedAt) return 1
    return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  })

  // Les contacts du service qui n'ont pas de session exacte (par ordre de création)
  const legacyContacts = (mission.value?.contacts || [])
    .filter((c: any) => {
      const cSvcId = (c.serviceId !== undefined && c.serviceId !== null) ? c.serviceId : c.service_id
      const hasExact = sessions.value.some(s => s.contactId === c.id || s.contact_id === c.id)
      return !hasExact && String(cSvcId) === String(contactServiceId)
    })
    .sort((a: any, b: any) => a.id - b.id)

  const contactIndex = legacyContacts.findIndex((c: any) => c.id === contactId)
  if (contactIndex !== -1 && contactIndex < legacySessions.length) {
    return legacySessions[contactIndex]
  }

  return null
}

function getRespondentStatus(contactId: number): 'pending' | 'in-progress' | 'completed' {
  const session = getContactSession(contactId)
  if (!session) return 'pending'
  if (session.completedAt) return 'completed'
  return 'in-progress'
}

function hasResponded(contactId: number): boolean {
  return getRespondentStatus(contactId) === 'completed'
}

// Group respondents by status
const respondentsByStatus = computed(() => {
  if (!mission.value?.contacts) return { pending: [], inProgress: [], completed: [] }
  
  const pending: any[] = []
  const inProgress: any[] = []
  const completed: any[] = []
  
  mission.value.contacts.forEach((contact: any) => {
    const status = getRespondentStatus(contact.id)
    if (status === 'pending') {
      pending.push(contact)
    } else if (status === 'in-progress') {
      inProgress.push(contact)
    } else {
      completed.push(contact)
    }
  })
  
  return { pending, inProgress, completed }
})

function getContactSessionId(contactId: number): number | null {
  const session = getContactSession(contactId)
  return session?.id || null
}



async function loadEmailTemplates() {
  try {
    const response = await fetch('/api/emails/templates')
    if (response.ok) {
      emailTemplates.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading email templates:', err)
  }
}

async function loadSignatureTemplates() {
  try {
    const response = await fetch('/api/emails/signature-templates')
    if (response.ok) {
      signatureTemplates.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading signature templates:', err)
  }
}

async function previewEmail() {
  if (!mission.value) {
    alert('Mission non chargée')
    return
  }
  
  if (!emailTemplate.value) {
    alert('Veuillez sélectionner un template d\'email')
    return
  }
  
  if (!deadlineDate.value) {
    alert('Veuillez sélectionner une date limite')
    return
  }

  try {
    const response = await fetch('/api/emails/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        missionId: mission.value.id,
        contactId: selectedContacts.value.length > 0 ? selectedContacts.value[0] : null,
        templateId: emailTemplate.value,
        deadlineDate: deadlineDate.value,
        customMessage: customMessage.value || null,
        signatureTemplateId: signatureTemplate.value || null
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Erreur lors de la prévisualisation'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }

    emailPreview.value = await response.json()
    showEmailPreview.value = true
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la prévisualisation')
    console.error('Preview error:', err)
  }
}

async function createSignatureTemplate() {
  if (!newSignatureName.value || !newSignatureContent.value) {
    alert('Veuillez remplir tous les champs obligatoires')
    return
  }

  try {
    const response = await fetch('/api/emails/signature-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        name: newSignatureName.value.trim(),
        html_content: newSignatureContent.value.trim(),
        is_default: newSignatureIsDefault.value
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Erreur lors de la création du template'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }

    // Reload templates
    await loadSignatureTemplates()
    
    // Reset form
    newSignatureName.value = ''
    newSignatureContent.value = ''
    newSignatureIsDefault.value = false
    
    alert('Template de signature créé avec succès')
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la création du template')
    console.error('Create signature template error:', err)
  }
}

const allContactsSelected = computed(() => {
  return mission.value?.contacts?.length > 0 && 
         selectedContacts.value.length === mission.value.contacts.length
})

function toggleAllContacts() {
  if (allContactsSelected.value) {
    selectedContacts.value = []
  } else {
    selectedContacts.value = mission.value?.contacts?.map((c: any) => c.id) || []
  }
}

const canSendEmails = computed(() => {
  return emailTemplate.value && deadlineDate.value && selectedContacts.value.length > 0
})

async function confirmAndSend() {
  showEmailPreview.value = false
  await sendQuestionnaires()
}

function handleFileChange(event: any) {
  const file = event.target.files[0]
  if (!file) {
    attachedFile.value = null
    attachedFileData.value = null
    return
  }

  attachedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    // Store only the base64 data part
    attachedFileData.value = result.split(',')[1]
  }
  reader.readAsDataURL(file)
}

async function sendQuestionnaires() {
  if (!canSendEmails.value || !mission.value) return

  isSending.value = true
  sendDone.value = false

  try {
    const response = await fetch('/api/emails/send-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        missionId: mission.value.id,
        contactIds: selectedContacts.value,
        templateId: emailTemplate.value,
        deadlineDate: deadlineDate.value,
        customMessage: customMessage.value || null,
        signatureTemplateId: signatureTemplate.value || null,
        attachment: attachedFileData.value ? {
          filename: attachedFile.value?.name,
          content: attachedFileData.value,
          contentType: attachedFile.value?.type
        } : null
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de l\'envoi')
    }

    const result = await response.json()
    const sentCount = result.sent || 0
    const failedCount = result.failed || 0

    // Bouton passe en vert
    sendDone.value = true

    // Recharger l'historique des emails
    await loadEmailHistory()

    // Envoyer un email de confirmation au chef de projet (contact référent ou consultant)
    try {
      const referent = mission.value.contacts?.find((c: any) => c.isReferent || c.is_referent)
      const confirmTo = referent?.email || mission.value.consultant?.email
      if (confirmTo) {
        await fetch('/api/emails/send-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            to: confirmTo,
            missionName: mission.value.organizationName,
            sentCount,
            failedCount
          })
        })
      }
    } catch (confirmErr) {
      console.warn('Email de confirmation non envoyé:', confirmErr)
    }

    // Reset form après 3s
    setTimeout(() => {
      sendDone.value = false
      selectedContacts.value = []
      emailTemplate.value = ''
      deadlineDate.value = ''
      customMessage.value = ''
      signatureTemplate.value = ''
      attachedFile.value = null
      attachedFileData.value = null
    }, 3000)
  } catch (err: any) {
    alert(err.message || 'Erreur lors de l\'envoi des emails')
  } finally {
    isSending.value = false
  }
}

async function loadEmailHistory() {
  try {
    const response = await fetch(`/api/emails/logs?missionId=${mission.value?.id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
    if (response.ok) {
      emailHistory.value = await response.json()
    }
  } catch (err) {
    console.error('Error loading email history:', err)
  }
}

async function relanceContact(contactId: number) {
  if (!mission.value || !deadlineDate.value) {
    alert('Veuillez d\'abord définir une date limite dans le formulaire d\'envoi')
    return
  }

  try {
    const response = await fetch('/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        missionId: mission.value.id,
        contactId: contactId,
        templateId: 'reminder',
        deadlineDate: deadlineDate.value,
        variables: {
          custom_message: customMessage.value || null
        },
        attachment: attachedFileData.value ? {
          filename: attachedFile.value?.name,
          content: attachedFileData.value,
          contentType: attachedFile.value?.type
        } : null
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la relance')
    }

    alert('Email de relance envoyé avec succès')
  } catch (err: any) {
    alert(err.message || 'Erreur lors de l\'envoi de la relance')
  }
}

async function deleteSession(sessionId: number) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return

  try {
    const response = await fetch(`/api/missions/${props.params.id}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la suppression')
    }

    await loadSessions()
    alert('Session supprimée avec succès')
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la suppression')
  }
}

async function deleteSelectedSessions() {
  if (selectedSessions.value.length === 0) return
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedSessions.value.length} session(s) ?`)) return

  try {
    for (const sessionId of selectedSessions.value) {
      const response = await fetch(`/api/missions/${props.params.id}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }
    }

    selectedSessions.value = []
    await loadSessions()
    alert('Sessions supprimées avec succès')
  } catch (err: any) {
    alert(err.message || 'Erreur lors de la suppression')
  }
}

function handleDelete() {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
    // TODO: Implement delete
    router.push('/admin/dashboard')
  }
}

async function toggleSuspendMission() {
  if (!mission.value) return
  const isSuspended = mission.value.status === 'suspended'
  const newStatus = isSuspended ? 'in_progress' : 'suspended'
  
  if (!confirm(`Voulez-vous ${isSuspended ? 'reprendre' : 'suspendre'} cette mission ?`)) return

  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`/api/missions/${props.params.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })

    if (!response.ok) {
      throw new Error('Erreur lors du changement de statut')
    }

    mission.value.status = newStatus
  } catch (err: any) {
    alert(err.message || 'Erreur lors du changement de statut')
  }
}

async function createEmailTemplate() {
  alert('Fonctionnalité de création de template d\'email à implémenter');
}
</script>

<style lang="scss" scoped>
.mission-details {
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
  
  .btn-back {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $gray-600;
    text-decoration: none;
    font-size: $font-size-sm;
    margin-bottom: $spacing-sm;
    
    &:hover {
      color: $primary;
    }
  }
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    h1 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-2xl;
    }
    
    .mission-subtitle {
      margin: 0;
      font-size: $font-size-sm;
      color: $gray-600;
    }
    
    .badge-status {
      &.active {
        background: rgba(16, 185, 129, 0.1);
        color: #065f46;
        padding: $spacing-xs $spacing-sm;
        border-radius: $radius-md;
        font-size: $font-size-xs;
        font-weight: 600;
      }
    }
  }
  
  .header-actions {
    display: flex;
    gap: $spacing-md;
    margin-top: $spacing-md;
  }
  
  .btn-danger {
    @include button-primary;
    background: $danger;
    
    &:hover {
      background: $danger-dark;
    }
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-lg;
}

.mission-content {
  @include card;
  padding: 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
  padding: $spacing-xl;
  border-bottom: 1px solid $gray-200;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $gray-50;
  border-radius: $radius-lg;
  
  .summary-icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: rgba(0, 102, 204, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $primary;
    flex-shrink: 0;
  }
  
  .summary-content {
    flex: 1;
    
    h3 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-sm;
      color: $gray-600;
      font-weight: 500;
    }
    
    .summary-value {
      margin: 0;
      font-size: $font-size-2xl;
      font-weight: 700;
      color: #111827;
    }
  }
}

.tabs {
  display: flex;
  border-bottom: 2px solid $gray-200;
  margin-bottom: $spacing-xl;
}

.tab {
  padding: $spacing-md $spacing-lg;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: 700;
  font-size: $font-size-base;
  transition: all 0.2s;
  
  // Couleurs par défaut (inactif)
  &.tab-orange {
    color: $gray-600;
    &:hover {
      color: #f97316;
    }
    &.active {
      color: #f97316;
      border-bottom-color: #f97316;
    }
  }
  
  &.tab-teal {
    color: $gray-600;
    &:hover {
      color: #10b981;
    }
    &.active {
      color: #10b981;
      border-bottom-color: #10b981;
    }
  }
  
  &.tab-purple {
    color: $gray-600;
    &:hover {
      color: #9333ea;
    }
    &.active {
      color: #9333ea;
      border-bottom-color: #9333ea;
    }
  }
  
  &.tab-blue {
    color: $gray-600;
    &:hover {
      color: $primary;
    }
    &.active {
      color: $primary;
      border-bottom-color: $primary;
    }
  }
}

.tab-content {
  min-height: 400px;
  padding: $spacing-xl;
}

.panel-header {
  margin-bottom: $spacing-xl;
  
  h2 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xl;
  }
  
  .panel-subtitle {
    margin: 0;
    font-size: $font-size-sm;
    color: $gray-600;
  }
}

.info-card {
  @include card;
  margin-bottom: $spacing-xl;
  padding: $spacing-xl;
  
  h2 {
    margin-bottom: $spacing-lg;
    font-size: $font-size-xl;
  }
  
  .section-title {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-bottom: $spacing-xs;
    border-bottom: 2px solid;
    
    &.section-title-orange {
      color: #f97316; // Orange
      border-bottom-color: #f97316;
    }
    
    &.section-title-teal {
      color: #10b981; // Teal/Vert
      border-bottom-color: #10b981;
    }
    
    &.section-title-purple {
      color: #9333ea; // Violet
      border-bottom-color: #9333ea;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
}

.referent-contact {
  margin-bottom: $spacing-lg;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.contact-separator {
  height: 1px;
  background-color: $gray-200;
  margin: $spacing-lg 0;
}

.info-item {
  label {
    display: block;
    font-size: $font-size-sm;
    color: $gray-600;
    margin-bottom: $spacing-xs;
  }

  p {
    margin: 0;
    font-weight: 500;
  }
}

.services-contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-md;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.service-section-compact {
  @include card;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  
  .service-header-compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $gray-200;
    
    .service-title {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      
      h3 {
        margin: 0;
        font-size: $font-size-base;
        font-weight: 600;
        color: $primary;
      }
      
      .service-code {
        font-size: $font-size-xs;
        color: $gray-500;
        font-family: $font-mono;
      }
    }
    
    .badge-purple {
      background: #9333ea;
      color: white;
      padding: $spacing-xs $spacing-sm;
      border-radius: 9999px;
      font-size: $font-size-xs;
      font-weight: 600;
    }
  }
  
  .contacts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: $spacing-xs;
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }
}

.empty-contacts {
  padding: $spacing-md;
  text-align: center;
  color: $gray-400;
  font-style: italic;
  
  .empty-message {
    margin: 0;
    font-size: $font-size-sm;
  }
}

.contact-item-compact {
  padding: $spacing-xs $spacing-sm;
  background: $gray-50;
  border-radius: $radius-sm;
  border: 1px solid $gray-200;
  transition: all 0.2s ease;
  
  &:hover {
    background: $gray-100;
    border-color: $primary;
  }
  
  .contact-name {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $gray-900;
    margin-bottom: 2px;
    line-height: 1.3;
  }
  
  .contact-email {
    font-size: $font-size-xs;
    color: $gray-600;
    margin-bottom: 2px;
    word-break: break-word;
    line-height: 1.3;
  }
  
  .contact-phone {
    font-size: $font-size-xs;
    color: $gray-500;
    line-height: 1.3;
  }
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.session-card {
  @include card;
  padding: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .session-info {
    flex: 1;
    
    .session-id {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-sm;
      color: $gray-700;
      display: inline-block;
      margin-right: $spacing-sm;
    }
    
    .session-service {
      margin: $spacing-xs 0;
      font-size: $font-size-sm;
      color: $gray-600;
    }
    
    .session-dates {
      margin: $spacing-xs 0;
      font-size: $font-size-sm;
      color: $gray-600;
    }
    
    .session-summary {
      margin: $spacing-xs 0 0 0;
      font-size: $font-size-sm;
      color: $gray-700;
      font-weight: 500;
    }
  }
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.link-card {
  @include card;
  padding: $spacing-lg;
  
  .link-header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    
    h3 {
      margin: 0;
      flex: 1;
      font-size: 24px;
      font-weight: 700;
      
      &.service-name-colored {
        &.service-color-0 {
          color: #f97316; // Orange
        }
        
        &.service-color-1 {
          color: #10b981; // Teal/Vert
        }
        
        &.service-color-2 {
          color: #9333ea; // Violet
        }
        
        &.service-color-3 {
          color: $primary; // Bleu
        }
      }
    }
    
    .badge-purple {
      background: #9333ea;
      color: white;
      padding: $spacing-xs $spacing-sm;
      border-radius: 9999px;
      font-size: $font-size-xs;
      font-weight: 600;
    }
  }
  
  .link-actions {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }
  
  .service-link-section {
    margin-bottom: $spacing-lg;
    
    .link-label {
      display: block;
      font-size: $font-size-sm;
      font-weight: 500;
      color: $gray-700;
      margin-bottom: $spacing-xs;
    }
    
    .link-input-group {
      display: flex;
      gap: $spacing-xs;
      align-items: center;
      
      .link-input {
        flex: 1;
        padding: 14px 18px;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        font-family: 'Courier New', monospace;
        background: #f9fafb;
        color: #111827;
        font-weight: 500;
        
        &:focus {
          outline: none;
          border-color: #3b82f6;
        }
      }
    }
  }
  
  .contacts-list {
    .link-label {
      display: block;
      font-size: $font-size-sm;
      font-weight: 500;
      color: $gray-700;
      margin-bottom: $spacing-sm;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-sm;
      border: 1px solid $gray-200;
      border-radius: $radius-md;
      margin-bottom: $spacing-xs;
      background: white;
      
      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        
        .contact-name {
          font-weight: 500;
          color: $gray-900;
        }
        
        .contact-role {
          font-size: $font-size-sm;
          color: $gray-600;
        }
        
        .contact-email {
          font-size: $font-size-xs;
          color: $gray-500;
        }
      }
      
      .btn-small {
        padding: $spacing-xs $spacing-sm;
        font-size: $font-size-sm;
        white-space: nowrap;
      }
    }
  }
  
  .btn-icon {
    min-width: 150px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 16px;
    border: 1px solid #00B1E6;
    border-radius: 9999px;
    background: #00B1E6;
    color: white;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s;
    
    svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    
    &:hover {
      background: #0099cc;
      border-color: #0099cc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 177, 230, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

.link-url {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-sm;

  input {
    flex: 1;
    @include input;
  }
}




.badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-md;
  font-size: $font-size-xs;
  font-weight: 600;
  text-transform: uppercase;

  &.preparation { background: $gray-200; color: $gray-700; }
  &.in_progress { background: rgba(0, 102, 204, 0.1); color: $primary-dark; }
  &.suspended { background: rgba(245, 158, 11, 0.1); color: #92400e; }
  &.closed { background: rgba(16, 185, 129, 0.1); color: #065f46; }
  &.primary { background: $primary; color: white; }
  &.success { background: rgba(16, 185, 129, 0.1); color: #065f46; }
  &.warning { background: rgba(245, 158, 11, 0.1); color: #92400e; }
  &.badge-purple { background: #9333ea; color: white; }
}

.email-section {
  @include card;
  padding: $spacing-xl;
  margin-bottom: $spacing-xl;
  
  h2 {
    margin-bottom: $spacing-sm;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-sent {
  background: #10b981 !important;
  border-color: #10b981 !important;
  
  &:hover {
    background: #059669 !important;
  }
}

.email-history-table {
  margin-top: $spacing-lg;
  overflow-x: auto;
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: $font-size-sm;
    
    thead {
      th {
        text-align: left;
        padding: $spacing-sm $spacing-md;
        background: $gray-50;
        font-weight: 600;
        color: $gray-600;
        border-bottom: 1px solid $gray-200;
        white-space: nowrap;
      }
    }
    
    tbody {
      tr {
        border-bottom: 1px solid $gray-100;
        transition: background 0.15s;
        
        &:hover {
          background: $gray-50;
        }
      }
      
      td {
        padding: $spacing-sm $spacing-md;
        color: $gray-700;
        vertical-align: middle;
      }
    }
  }
}

.badge-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: $font-size-xs;
  font-weight: 600;
}

.email-form {
  margin-top: $spacing-lg;
  
  .form-group {
    margin-bottom: $spacing-lg;
    
    label {
      display: block;
      margin-bottom: $spacing-xs;
      font-weight: 500;
      color: $gray-700;
    }
    
    .form-input {
      @include input;
    }
    
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }
    
    .radio-label {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      cursor: pointer;
      
      input[type="radio"] {
        width: auto;
      }
    }
  }
  
  .btn-send {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
  }
}

.empty-state {
  text-align: center;
  padding: $spacing-2xl;
  color: $gray-400;
  
  svg {
    margin: 0 auto $spacing-md;
  }
  
  p {
    margin: 0;
    font-size: $font-size-sm;
  }
}

.btn-primary {
  @include button-primary;
}

.btn-secondary {
  @include button-secondary;
}

.loading, .error, .empty {
  text-align: center;
  padding: $spacing-2xl;
  color: $gray-600;
}

.error {
  color: $danger;
}

// Styles pour le mode édition
.mission-edit {
  min-height: 100vh;
  background: $gray-100;
  
  .edit-header {
    background: white;
    box-shadow: $shadow-sm;
    padding: $spacing-lg 0;
    margin-bottom: $spacing-xl;
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 $spacing-lg;
    }
    
    .edit-header-content {
      @include flex-between;
      align-items: center;
    }
    
    h1 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-2xl;
      color: $gray-900;
      font-weight: 700;
    }
    
    .edit-subtitle {
      margin: 0;
      font-size: $font-size-base;
      color: $gray-600;
    }
  }
  
  .main {
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 $spacing-lg;
    }
  }
  
  .wizard {
    @include card;
    padding: $spacing-xl;
    background: white;
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
      font-size: $font-size-lg;
    }
    
    .step-label {
      font-size: $font-size-sm;
      color: $gray-600;
      text-align: center;
      font-weight: 500;
    }
    
    &.active {
      .step-number {
        background: $primary;
        color: white;
        box-shadow: 0 4px 12px rgba($primary, 0.3);
      }
      
      .step-label {
        color: $primary;
        font-weight: 600;
      }
    }
    
    &.completed {
      .step-number {
        background: $success;
        color: white;
      }
      
      .step-label {
        color: $success;
      }
    }
  }
  
  .wizard-content {
    min-height: 400px;
  }
  
  .step-content {
    h2 {
      margin-bottom: $spacing-lg;
      font-size: $font-size-xl;
      color: $primary;
      font-weight: 700;
    }
    
    > p {
      margin-bottom: $spacing-lg;
      color: $gray-600;
      font-size: $font-size-base;
    }
  }
  
  .form-group {
    margin-bottom: $spacing-lg;
    
    label {
      display: block;
      margin-bottom: $spacing-xs;
      font-weight: 500;
      color: $gray-700;
      font-size: $font-size-sm;
    }
    
    input, select, textarea {
      @include input;
      width: 100%;
      font-size: $font-size-base;
    }
    
    textarea {
      resize: vertical;
      min-height: 80px;
    }
  }
  
  .section-divider {
    margin: $spacing-xl 0 $spacing-lg 0;
    padding-top: $spacing-lg;
    border-top: 2px solid $gray-200;
    
    h3 {
      margin: 0;
      font-size: $font-size-base;
      font-weight: 600;
      color: $primary;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-md;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .service-item, .contact-item {
    @include card;
    margin-bottom: $spacing-lg;
    padding: $spacing-lg;
    background: white;
    border: 1px solid $gray-200;
    border-radius: $radius-lg;
  }
  
  .service-item-new {
    display: flex;
    gap: $spacing-md;
    align-items: center;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: $gray-50;
    border-radius: $radius-md;
    border: 1px dashed $gray-300;
    
    .service-input-new {
      flex: 1;
      @include input;
      margin-bottom: 0;
      background: white;
    }
    
    .btn-create-wrapper {
      position: relative;
      
      &.has-tooltip .tooltip {
        display: block;
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
      transition: all 0.3s ease;
      padding: $spacing-sm $spacing-lg;
      
      &.btn-success {
        background: $success;
        color: white;
        
        &:hover:not(:disabled) {
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
    margin-bottom: $spacing-md;
    padding: $spacing-md;
    background: $gray-50;
    border-radius: $radius-md;
    border: 1px solid $gray-200;
    
    .service-input-validated {
      flex: 1;
      @include input;
      margin-bottom: 0;
      background: white;
      color: $gray-700;
      cursor: not-allowed;
      border-color: $gray-300;
    }
  }
  
  .contact-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $gray-200;
    
    .contact-checkboxes {
      display: flex;
      gap: $spacing-lg;
      flex-wrap: wrap;
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      cursor: pointer;
      font-weight: 500;
      font-size: $font-size-sm;
      
      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin: 0;
        padding: 0;
        cursor: pointer;
        accent-color: $primary;
      }
      
      span {
        user-select: none;
      }
    }
  }
  
  .no-services-message {
    padding: $spacing-lg;
    background: $gray-50;
    border-radius: $radius-md;
    text-align: center;
    color: $gray-600;
    margin-top: $spacing-md;
    border: 1px dashed $gray-300;
  }
  
  .summary {
    background: $gray-50;
    padding: $spacing-xl;
    border-radius: $radius-lg;
    border: 1px solid $gray-200;
    
    h3 {
      margin-top: $spacing-lg;
      margin-bottom: $spacing-md;
      color: $primary;
      font-size: $font-size-lg;
      font-weight: 600;
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    p {
      margin: $spacing-sm 0;
      color: $gray-700;
      line-height: 1.6;
    }
    
    ul {
      margin-left: $spacing-lg;
      margin-bottom: $spacing-lg;
      color: $gray-700;
      line-height: 1.8;
      
      li {
        margin-bottom: $spacing-xs;
      }
    }
  }
  
  .wizard-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-md;
    margin-top: $spacing-xl;
    padding-top: $spacing-xl;
    border-top: 2px solid $gray-200;
  }
}

// Styles pour le suivi en temps réel et l'envoi d'emails
.tracking-card,
.send-actions-card,
.respondents-section {
  @include card;
  padding: $spacing-2xl;
  margin-bottom: $spacing-xl;
  background: white;
  border: 1px solid $gray-200;
  border-radius: $radius-lg;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  h2 {
    margin-bottom: $spacing-xl;
    font-size: $font-size-2xl;
    color: $primary;
    font-weight: 700;
    border-bottom: 3px solid $primary;
    padding-bottom: $spacing-md;
  }
}

.tracking-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-xl;
  margin-top: $spacing-lg;
}

.tracking-stat {
  h3 {
    margin-bottom: $spacing-md;
    font-size: $font-size-lg;
    color: $primary;
    font-weight: 600;
  }
}

.progress-bar-container {
  width: 100%;
  height: 28px;
  background: $gray-200;
  border-radius: $radius-full;
  overflow: hidden;
  margin-bottom: $spacing-sm;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &.small {
    height: 20px;
  }
}

.progress-bar {
  height: 100%;
  background: $primary; // Default color, will be overridden by inline style
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
  border-radius: $radius-full;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  
  // Remove shimmer effect when color is set via inline style
  &[style*="background"]::after {
    display: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 2s infinite;
    pointer-events: none;
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: $font-size-sm;
  color: $gray-700;
  margin: $spacing-xs 0 0 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  
  &::before {
    content: '📊';
    font-size: $font-size-base;
  }
}

.service-progress {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: white;
  border-radius: $radius-md;
  border: 1px solid $gray-200;
  transition: all 0.2s;
  
  &:hover {
    border-color: $primary;
    box-shadow: 0 2px 8px rgba($primary, 0.1);
  }
  
  .service-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    font-size: $font-size-base;
    font-weight: 600;
    color: $gray-900;
    gap: $spacing-md;
    
    .service-link {
      text-decoration: none;
      color: $gray-900;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      flex: 1;
      padding: $spacing-xs 0;
      
      &:hover {
        color: $primary;
        text-decoration: underline;
      }
      
      span {
        font-weight: 600;
      }
      
      &::after {
        content: '→';
        margin-left: $spacing-xs;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        transform: translateX(-4px);
      }
      
      &:hover::after {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
  
  .progress-percentage {
    font-weight: 700;
    color: $primary;
    font-size: $font-size-lg;
    background: rgba($primary, 0.1);
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-md;
  }
}

.send-form {
  margin-top: $spacing-xl;
  
  .form-group {
    margin-bottom: $spacing-xl;
    
    label {
      display: block;
      margin-bottom: $spacing-sm;
      font-weight: 600;
      color: $gray-900;
      font-size: $font-size-sm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      &::after {
        content: '';
        display: block;
        width: 30px;
        height: 2px;
        background: $primary;
        margin-top: $spacing-xs;
      }
    }
    
    .form-input {
      @include input;
      width: 100%;
      font-size: $font-size-base;
      border: 2px solid $gray-300;
      transition: all 0.2s;
      padding: $spacing-md;
      
      &:focus {
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba($primary, 0.1);
        outline: none;
      }
      
      &::placeholder {
        color: $gray-400;
      }
    }
    
    select.form-input {
      background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right $spacing-md center;
      padding-right: $spacing-2xl;
      appearance: none;
      cursor: pointer;
    }
    
    input[type="date"].form-input {
      position: relative;
      
      &::-webkit-calendar-picker-indicator {
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
        
        &:hover {
          opacity: 1;
        }
      }
    }
    
    textarea.form-input {
      resize: vertical;
      min-height: 100px;
      font-family: inherit;
      line-height: 1.6;
    }
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-lg;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: $spacing-xl;
    }
  }
  
  .btn-primary {
    @include button-primary;
    padding: $spacing-md $spacing-2xl;
    font-size: $font-size-base;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    box-shadow: 0 4px 12px rgba($primary, 0.3);
    transition: all 0.3s;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba($primary, 0.4);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
}

.contacts-selection {
  margin-top: $spacing-md;
  
  .select-all-label {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    margin-bottom: $spacing-lg;
    cursor: pointer;
    font-weight: 600;
    color: $gray-900;
    border-bottom: 2px solid $primary;
    padding-bottom: $spacing-md;
    
    input[type="checkbox"] {
      width: 22px;
      height: 22px;
      margin: 0;
      padding: 0;
      cursor: pointer;
      accent-color: $primary;
      flex-shrink: 0;
    }
    
    span {
      font-size: $font-size-base;
    }
  }
  
  .contacts-list-select {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    max-height: 350px;
    overflow-y: auto;
    border: 2px solid $gray-200;
    border-radius: $radius-lg;
    padding: $spacing-lg;
    margin-top: $spacing-md;
    background: $gray-50;
    
    &::-webkit-scrollbar {
      width: 10px;
    }
    
    &::-webkit-scrollbar-track {
      background: white;
      border-radius: $radius-sm;
    }
    
    &::-webkit-scrollbar-thumb {
      background: $primary;
      border-radius: $radius-sm;
      border: 2px solid white;
      
      &:hover {
        background: $primary-dark;
      }
    }
  }
}

.contact-select-item {
  padding: $spacing-lg;
  border: 1px solid $gray-200;
  border-radius: $radius-md;
  background: white;
  transition: all 0.2s;
  
  &:hover {
    background: rgba($primary, 0.05);
    border-color: $primary;
    box-shadow: 0 2px 8px rgba($primary, 0.1);
  }

  &.contact-primary {
    background: rgba(147, 51, 234, 0.08); // Violet clair pour contact principal
    border-color: #9333ea; // Violet
    border-left: 4px solid #9333ea; // Bordure gauche violette
    
    &:hover {
      background: rgba(147, 51, 234, 0.12);
      box-shadow: 0 2px 8px rgba(147, 51, 234, 0.15);
    }
  }

  &.contact-referent {
    background: rgba(14, 116, 144, 0.06); // Bleu/vert clair pour référent
    border-color: #0e7490;
    border-left: 3px solid #0e7490;

    &:hover {
      background: rgba(14, 116, 144, 0.1);
      box-shadow: 0 2px 8px rgba(14, 116, 144, 0.15);
    }
  }
  




  .contact-info-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    
    .contact-name-email {
      font-size: $font-size-base;
      font-weight: 500;
      color: $gray-900;
      line-height: 1.5;
      word-break: break-word;
    }
  }
    
    .badge {
      align-self: flex-start;
      padding: $spacing-xs $spacing-md;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: $spacing-xs;
      
      &.badge-success {
        background: rgba(16, 185, 129, 0.15);
        color: #065f46;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      
      &.badge-warning {
        background: rgba(245, 158, 11, 0.15);
        color: #92400e;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      &.badge-primary-contact {
        background: rgba(147, 51, 234, 0.15);
        color: #6b21a8;
        border: 1px solid rgba(147, 51, 234, 0.3);
        font-weight: 700;
      }

      &.badge-referent-contact {
        background: rgba(14, 116, 144, 0.15);
        color: #0f766e;
        border: 1px solid rgba(14, 116, 144, 0.3);
        font-weight: 700;
      }
    }
  }

.respondents-by-status {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  margin-top: $spacing-lg;
}

.status-group {
  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 2px solid $gray-200;
    
    h3 {
      margin: 0;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $gray-900;
    }
  }
  
  .respondents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: $spacing-md;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: $spacing-sm;
    }
  }
}

.respondent-card-compact {
  @include card;
  padding: $spacing-md $spacing-lg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-lg;
  transition: all 0.2s ease;
  min-height: 90px;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .checkbox-label-compact {
    display: flex;
    align-items: flex-start;
    gap: $spacing-md;
    flex: 1;
    cursor: pointer;
    margin: 0;
    
    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin: 0;
      margin-top: 2px;
      cursor: pointer;
      accent-color: $primary;
      flex-shrink: 0;
    }
    
    .respondent-info-compact {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      
      .respondent-name {
        font-weight: 600;
        font-size: $font-size-base;
        color: $gray-900;
        line-height: 1.4;
        margin-bottom: 0;
      }
      
      .respondent-email {
        font-size: $font-size-sm;
        color: $gray-600;
        word-break: break-word;
        line-height: 1.4;
        margin-bottom: 0;
      }
      
      .respondent-phone {
        font-size: $font-size-sm;
        color: $gray-500;
        line-height: 1.4;
        margin-bottom: 0;
      }
      
      .session-info-compact {
        font-size: $font-size-xs;
        color: $gray-500;
        margin-top: $spacing-xs;
        line-height: 1.4;
      }
    }
  }
  
  .respondent-status-compact {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;
    margin-left: $spacing-md;
    
    .badge {
      white-space: nowrap;
      padding: $spacing-xs $spacing-md;
    }
    
    .respondent-actions-compact {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      margin-left: $spacing-xs;
    }
  }
}

.btn-icon-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid $gray-300;
  border-radius: $radius-sm;
  background: white;
  color: $gray-700;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: $gray-50;
    border-color: $primary;
    color: $primary;
  }
  
  &.btn-danger {
    border-color: $red-300;
    color: $red-600;
    
    &:hover {
      background: $red-50;
      border-color: $red-500;
      color: $red-700;
    }
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
}

.badge-info {
  background: #3b82f6;
  color: white;
  padding: $spacing-xs $spacing-sm;
  border-radius: 9999px;
  font-size: $font-size-xs;
  font-weight: 600;
}

.respondent-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
}

.respondent-info {
  margin-left: $spacing-md;
  flex: 1;
  
  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $gray-900;
  }
  
  p {
    margin: $spacing-xs 0;
    font-size: $font-size-base;
    color: $gray-600;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    
    &::before {
      content: '';
      width: 4px;
      height: 4px;
      background: $gray-400;
      border-radius: 50%;
    }
  }
}

.respondent-status {
  .badge {
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-full;
    font-size: $font-size-sm;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    &.badge-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
    }
    
    &.badge-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      border: none;
    }
  }
}

.session-details {
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 2px solid $gray-100;
  
  p {
    margin: $spacing-xs 0;
    font-size: $font-size-sm;
    color: $gray-600;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    
    &::before {
      content: '🕐';
      font-size: $font-size-base;
    }
  }
}

.respondent-status {
  .badge {
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-full;
    font-size: $font-size-sm;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    &.badge-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
    }
    
    &.badge-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      border: none;
    }
  }
}

.session-actions {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-lg;
  flex-wrap: wrap;
  padding-top: $spacing-md;
  border-top: 2px solid $gray-100;
  
  .btn-secondary,
  .btn-danger {
    padding: $spacing-sm $spacing-lg;
    font-weight: 600;
    border-radius: $radius-md;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }
  
  .btn-danger {
    background: $danger;
    color: white;
    border: none;
    
    &:hover {
      background: $danger-dark;
    }
  }
}

.no-session {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: $gray-50;
  border-radius: $radius-md;
  text-align: center;
  color: $gray-600;
  font-size: $font-size-sm;
}

.summary-subtitle {
  font-size: $font-size-xs;
  color: $gray-600;
  margin-top: $spacing-xs;
}

// Timeline styles
// Timeline styles
.timeline-summary-card {
  .card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xl;
    
    .section-title { margin: 0; }
    .step-counter {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $gray-500;
      background: $gray-100;
      padding: 4px 12px;
      border-radius: $radius-full;
    }
  }
}

.mini-timeline-horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg 0;
  margin-bottom: $spacing-xl;
  
  .mini-step {
    display: flex;
    align-items: center;
    flex: 1;
    cursor: pointer;
    
    &:last-child {
      flex: 0;
      .step-line { display: none; }
    }
    
    .step-node {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-2px);
        .step-circle { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      }
    }
    
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid $gray-200;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: $font-size-sm;
      color: $gray-400;
      z-index: 2;
      transition: all 0.3s ease;
    }
    
    .step-label-mini {
      position: absolute;
      top: 40px;
      font-size: 10px;
      font-weight: 600;
      color: $gray-400;
      white-space: nowrap;
      display: none; // Hidden for extreme simplicity, but can be enabled if needed
    }
    
    .step-line {
      flex: 1;
      height: 4px;
      background: $gray-100;
      margin: 0 -2px;
      z-index: 1;
      transition: all 0.3s ease;
    }
    
    &.completed {
      .step-circle {
        background: $success;
        border-color: $success;
        color: white;
      }
      .step-line { background: $success; }
    }
    
    &.in-progress {
      .step-circle {
        border-color: $primary;
        color: $primary;
        box-shadow: 0 0 0 4px rgba($primary, 0.1);
      }
    }
  }
}

.timeline-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-md;
  padding-top: $spacing-lg;
  border-top: 1px solid $gray-100;
  
  .current-step-box {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .label {
      font-size: $font-size-sm;
      color: $gray-500;
      font-weight: 600;
    }
    
    .value {
      font-size: $font-size-sm;
      font-weight: 700;
      color: $gray-900;
    }
  }
  
  .btn-more {
    background: none;
    border: none;
    color: $primary;
    font-weight: 700;
    font-size: $font-size-sm;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.timeline-container {
  position: relative;
  padding: $spacing-xl 0;
}

.timeline-step {
  position: relative;
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.completed {
    .timeline-marker .marker-circle {
      background: $success;
      color: white;
      border-color: $success;
    }
    
    .timeline-connector {
      background: $success;
    }
  }
  
  &.in-progress {
    .timeline-marker .marker-circle {
      background: $primary;
      color: white;
      border-color: $primary;
      animation: pulse 2s infinite;
    }
    
    .timeline-connector {
      background: linear-gradient(to bottom, $success 0%, $primary 100%);
    }
  }
  
  &.pending {
    .timeline-marker .marker-circle {
      background: white;
      color: $gray-400;
      border-color: $gray-300;
    }
    
    .timeline-connector {
      background: $gray-200;
    }
  }
}

.timeline-connector {
  position: absolute;
  left: 19px;
  top: 40px;
  width: 2px;
  height: calc(100% + $spacing-xl);
  background: $gray-200;
  z-index: 0;
}

.timeline-marker {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  
  .marker-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid $gray-300;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    transition: all 0.3s ease;
    
    .step-number {
      font-weight: 700;
      font-size: $font-size-base;
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
}

.timeline-content {
  flex: 1;
  @include card;
  padding: $spacing-lg;
  margin-left: $spacing-md;
  
  .step-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-md;
    
    h3 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $gray-900;
    }
    
    .step-description {
      margin: 0;
      font-size: $font-size-sm;
      color: $gray-600;
    }
    
    .step-status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: 600;
      white-space: nowrap;
      
      &.completed {
        background: rgba($success, 0.1);
        color: $success;
      }
      
      &.in-progress {
        background: rgba($primary, 0.1);
        color: $primary;
      }
      
      &.pending {
        background: rgba($gray-400, 0.1);
        color: $gray-600;
      }
    }
  }
  
  .step-dates {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-md;
    flex-wrap: wrap;
    
    .date-item {
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      
      label {
        font-size: $font-size-xs;
        font-weight: 500;
        color: $gray-600;
      }
      
      .date-input {
        padding: $spacing-xs $spacing-sm;
        border: 1px solid $gray-300;
        border-radius: $radius-md;
        font-size: $font-size-sm;
        transition: border-color 0.2s;
        
        &:focus {
          outline: none;
          border-color: $primary;
        }
        
        &:disabled {
          background: $gray-50;
          cursor: not-allowed;
        }
      }
    }
  }
  
  .step-actions {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-lg;
}

.modal-content {
  background: white;
  border-radius: $radius-xl;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  
  &.modal-large {
    max-width: 1200px;
    width: 95%;
    max-height: 95vh;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xl;
  border-bottom: 1px solid $gray-200;
  
  h2 {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: 700;
  }
}

.btn-close-modal {
  background: none;
  border: none;
  cursor: pointer;
  color: $gray-600;
  padding: $spacing-xs;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  transition: all 0.2s;
  
  &:hover {
    background: $gray-100;
    color: $gray-900;
  }
}

.modal-body {
  padding: $spacing-xl;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
  padding: $spacing-xl;
  border-top: 1px solid $gray-200;
}

// Email preview styles
.email-preview {
  .preview-field {
    margin-bottom: $spacing-lg;
    
    label {
      display: block;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: $spacing-xs;
      font-size: $font-size-sm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    p {
      margin: 0;
      color: $gray-900;
      padding: $spacing-sm;
      background: $gray-50;
      border-radius: $radius-md;
    }
  }
  
  .preview-html {
    padding: $spacing-lg;
    background: $gray-50;
    border-radius: $radius-md;
    border: 1px solid $gray-200;
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
    
    :deep(h2) {
      margin-top: 0;
      color: $primary;
    }
    
    :deep(a) {
      color: $primary;
      text-decoration: underline;
    }
  }
}

// Signature manager styles
.signature-manager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-xl;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.signature-list {
  h3 {
    margin: 0 0 $spacing-lg 0;
    font-size: $font-size-lg;
    font-weight: 600;
  }
}

.signature-item {
  padding: $spacing-md;
  background: $gray-50;
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
  border: 1px solid $gray-200;
  
  .signature-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    
    strong {
      color: $gray-900;
    }
  }
  
  .signature-preview {
    padding: $spacing-sm;
    background: white;
    border-radius: $radius-sm;
    font-size: $font-size-sm;
    color: $gray-700;
    border: 1px solid $gray-200;
  }
}

.signature-form {
  h3 {
    margin: 0 0 $spacing-lg 0;
    font-size: $font-size-lg;
    font-weight: 600;
  }
  
  .signature-textarea {
    min-height: 300px;
    font-family: 'Courier New', monospace;
    font-size: $font-size-sm;
    resize: vertical;
  }
  
  small {
    display: block;
    margin-top: $spacing-xs;
    color: $gray-600;
    font-size: $font-size-xs;
  }
}

.form-actions {
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
  margin-top: $spacing-lg;
}

.btn-link {
  background: none;
  border: none;
  color: $primary;
  cursor: pointer;
  text-decoration: underline;
  font-size: $font-size-sm;
  padding: 0;
  
  &:hover {
    color: $primary-dark;
  }
}

/* GLOBAL CHECKBOX STYLES - ROBUST FIX */
/* Ces styles sont placés ici pour éviter tout problème d'imbrication SCSS */

.checkbox-row {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  width: 100%;
}

.checkbox-row input[type="checkbox"] {
  appearance: none !important;
  -webkit-appearance: none !important;
  width: 20px !important;
  height: 20px !important;
  border: 2px solid #d1d5db !important;
  border-radius: 4px !important;
  background: white !important;
  cursor: pointer !important;
  position: relative !important;
  flex-shrink: 0 !important;
  margin: 0 !important;
  display: grid !important;
  place-content: center !important;
}

.checkbox-row input[type="checkbox"]::before {
  content: "";
  width: 12px;
  height: 12px;
  transform: scale(0);
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1em 1em white;
  transform-origin: center;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}

.checkbox-row input[type="checkbox"]:checked {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.checkbox-row input[type="checkbox"]:checked::before {
  transform: scale(1);
}

.contact-info-wrapper {
  flex: 1;
}

/* Correction pour le texte "Sélectionner tous les contacts" */
.select-all-label span {
  line-height: 20px !important; /* Même hauteur que la checkbox */
  display: inline-block !important;
  vertical-align: middle !important;
}

.respondent-name, .contact-name-email {
  line-height: 1.3 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.checkbox-label {
   display: block !important;
   width: 100%;
   cursor: pointer;
}

.file-attachment-input {
  margin-top: $spacing-xs;
  
  .form-input {
    width: 100%;
  }
}

.file-info {
  margin: $spacing-xs 0 0 0;
  font-size: $font-size-sm;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  
  strong {
    color: #065f46;
  }
}
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
  border-bottom: 2px solid $gray-100;
  padding-bottom: $spacing-xs;

  .section-title {
    margin: 0;
    border-bottom: none;
    padding-bottom: 0;
  }
}

.btn-edit-small {
  background: $gray-100;
  color: $gray-600;
  border: 1px solid $gray-200;
  padding: 4px 12px;
  border-radius: $radius-md;
  font-size: $font-size-xs;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $primary;
    color: white;
    border-color: $primary;
  }
}

.services-mini-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.service-pill-outline {
  padding: 4px 12px;
  border: 1px solid $primary;
  color: $primary;
  border-radius: $radius-full;
  font-size: $font-size-sm;
  font-weight: 500;
  background: rgba($primary, 0.05);
}

.section-title-blue {
  border-bottom-color: $primary !important;
  color: $primary !important;
}

.info-card {
  @include card;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  
  &:last-child {
    margin-bottom: 0;
  }
}
</style>

