<template>
  <div class="landing">
    <!-- Branding is handled by HeaderKepler in App.vue -->
    
    <main class="main">
      <div class="container">
        <!-- Hero Section -->
        <section class="hero text-center py-12">
          <h1 class="hero-title">Évaluez votre maturité en IA & Data</h1>
          <p class="lead">
            Images & Réseaux, EDIH Bretagne et Pays de la Loire (European Digital Innovation Hub), accompagne les entreprises dans leur transformation numérique. Découvrez où vous en êtes avec nos diagnostics adaptés à vos besoins.
          </p>
        </section>

        <!-- Diagnostics Section -->
        <section class="diagnostics-section">
          <h2 class="section-title">Nos diagnostics</h2>
          <div class="diagnostics">
            <!-- Flash Diag Card -->
            <div class="diagnostic-card flash">
              <div class="card-header">
                <div class="icon-circle icon-blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="badge badge-green">5-10 minutes</span>
              </div>
              <h3>Flash Diag</h3>
              <p class="description">
                Un diagnostic rapide pour évaluer votre positionnement en matière d'IA et de données
              </p>
              <ul class="features">
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Questions simples et directes
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Réponses Oui / Non
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Résultats immédiats
                </li>
              </ul>
              <div class="action-container mt-auto">
                <button class="btn-primary btn-block" @click="isFlashModalOpen = true">
                  Démarrer mon Flash Diag
                </button>
              </div>
            </div>

            <!-- Maturity Assessment Card -->
            <div class="diagnostic-card maturity">
              <div class="card-header">
                <div class="icon-circle icon-gradient">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="6" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="2" fill="white"/>
                  </svg>
                </div>
                <span class="badge badge-orange">15-20 minutes</span>
              </div>
              <h3>Maturity Assessment</h3>
              <p class="description">
                Une évaluation approfondie de votre maturité sur 10 dimensions stratégiques
              </p>
              <ul class="features">
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  10 dimensions stratégiques analysées
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Échelle de réponses nuancées
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Recommandations personnalisées
                </li>
              </ul>
              <div class="benefit">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2Z" stroke="#9333ea" stroke-width="1.5"/>
                  <path d="M8 5V8L10 10" stroke="#9333ea" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Idéal pour un plan d'action concret
              </div>
              <div class="access-restricted">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7H11V5C11 2.79086 9.20914 1 7 1C4.79086 1 3 2.79086 3 5V7H2C1.44772 7 1 7.44772 1 8V13C1 13.5523 1.44772 14 2 14H12C12.5523 14 13 13.5523 13 13V8C13 7.44772 12.5523 7 12 7Z" stroke="#6b7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Accès réservé - Lien unique envoyé par votre chef de projet
              </div>
            </div>
          </div>
        </section>

        <!-- Process Section -->
        <section class="process-section">
          <h2>Comment ça marche ?</h2>
          <div class="steps">
            <div class="step-item">
              <div class="step-icon step-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="8.5" cy="7" r="4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="step-number">1</div>
              <h3 class="step-title step-title-blue">Identification</h3>
              <p>Renseignez les informations de base sur votre entreprise</p>
            </div>
            <div class="step-item">
              <div class="step-icon step-orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 4L12 14.01l-3-3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="step-number">2</div>
              <h3 class="step-title step-title-orange">Choix du diag</h3>
              <p>Sélectionnez le diagnostic adapté à votre besoin actuel</p>
            </div>
            <div class="step-item">
              <div class="step-icon step-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 20h9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="step-number">3</div>
              <h3 class="step-title step-title-green">Réponse</h3>
              <p>Répondez aux questions à votre rythme (5 à 20 minutes)</p>
            </div>
            <div class="step-item">
              <div class="step-icon step-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="6" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="2" fill="white"/>
                </svg>
              </div>
              <div class="step-number">4</div>
              <h3 class="step-title step-title-purple">Analyse</h3>
              <p>L'IA génère une analyse détaillée de votre maturité</p>
            </div>
            <div class="step-item">
              <div class="step-icon step-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="step-number">5</div>
              <h3 class="step-title step-title-red">Accompagnement</h3>
              <p>Recevez 3 rapports et un atelier collaboratif personnalisé</p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Flash Diag Modal -->
    <FlashDiagModal :is-open="isFlashModalOpen" @close="isFlashModalOpen = false" />
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import FlashDiagModal from '../components/FlashDiagModal.vue'

const props = defineProps<{ params: any; query: any }>()
const isFlashModalOpen = ref(false)
</script>


<style lang="scss" scoped>
.landing {
  min-height: 100vh;
  background: #f9fafb;
}

.container {
  max-width: 1250px;
  margin: 0 auto;
  padding: 0 2.5rem;
  
  @media (min-width: 1400px) {
    max-width: 1350px;
    padding: 0 4rem;
  }
}

.hero {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  margin-bottom: 1rem;
}

.lead {
  font-size: 1.25rem;
  color: #4b5563;
  line-height: 1.6;
}

.diagnostics-section {
  margin: 4rem 0;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
}

.diagnostics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.diagnostic-card {
  background: white;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .description {
    color: #6b7280;
    margin-bottom: 2rem;
    flex-grow: 1;
  }
  
  .mt-auto { margin-top: auto; }
}

.icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.icon-blue { background: #E6F4FE; svg path { fill: #00B1E6; stroke: #00B1E6; } }
.icon-gradient { background: linear-gradient(135deg, #00B1E6 0%, #FFDC00 100%); }

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
  
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: #4b5563;
    
    svg { margin-top: 0.25rem; }
  }
}

.benefit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.process-section {
  text-align: center;
  margin: 6rem 0;
  
  h2 { margin-bottom: 4rem; }
}

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 3rem;
}

.step-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  
  &.step-blue { background: #00B1E6; }
  &.step-orange { background: #f97316; }
  &.step-green { background: #10b981; }
  &.step-purple { background: #9333ea; }
  &.step-red { background: #ef4444; }
}

.step-number {
  position: absolute;
  top: 48px;
  right: calc(50% - 40px);
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.step-title {
  font-size: 1.125rem;
  margin-bottom: 0.75rem;
}

.access-restricted {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  gap: 0.5rem;
  text-align: left;
  line-height: 1.4;
}

.badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  
  &.badge-green { background: #DCFCE7; color: #166534; }
  &.badge-orange { background: #FFEDD5; color: #9A3412; }
}
.btn-primary {
  background: #00B1E6;
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
  
  &:hover {
    background: #0093c0;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 177, 230, 0.3);
  }
}

.btn-block { width: 100%; }
</style>
