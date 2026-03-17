<template>
  <div class="documentation-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="content-wrapper">
        <h1 class="hero-title">Guide Utilisateur <span class="highlight">Chef de Projet</span></h1>
        <p class="hero-subtitle">
          Maîtrisez la plateforme de diagnostic : de la création de mission à la génération des rapports IA.
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <div class="content-wrapper">
      <div class="steps-container">
        
        <!-- Step 1: Démarrer -->
        <div class="step-item">
          <div class="step-icon step-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
          </div>
          <div class="step-number">1</div>
          <h3 class="step-title">DÉMARRAGE</h3>
          <p class="step-desc">Lancez <code>start-servers.bat</code> et ouvrez le navigateur.</p>
        </div>

        <!-- Step 2: Créer -->
        <div class="step-item">
          <div class="step-icon step-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
          <div class="step-number">2</div>
          <h3 class="step-title">NOUVELLE MISSION</h3>
          <p class="step-desc">Créez une mission Flash ou Complète pour le client.</p>
        </div>

        <!-- Step 3: Inviter -->
        <div class="step-item">
          <div class="step-icon step-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <div class="step-number">3</div>
          <h3 class="step-title">INVITATIONS</h3>
          <p class="step-desc">Envoyez liens aux participants par email ou Teams.</p>
        </div>

        <!-- Step 4: Analyser -->
        <div class="step-item">
          <div class="step-icon step-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
          <div class="step-number">4</div>
          <h3 class="step-title">GÉNÉRATION IA</h3>
          <p class="step-desc">Utilisez l'IA pour analyser et régénérer.</p>
        </div>

        <!-- Step 5: Exporter -->
        <div class="step-item">
          <div class="step-icon step-red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div class="step-number">5</div>
          <h3 class="step-title">EXPORT PDF</h3>
          <p class="step-desc">Imprimez le rapport en PDF.</p>
        </div>

      </div>

      <div class="tip-box text-center">
        Pour plus de détails techniques, consultez le <a href="/README.md" target="_blank">fichier README</a>.
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.documentation-page {
  background-color: #f9fafb; /* Lighter background matching landing */
  min-height: 100vh;
  padding-bottom: 4rem;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2.5rem;
  
  @media (min-width: 1400px) {
    max-width: 1300px;
    padding: 0 4rem;
  }
}

/* Hero */
.hero-section {
  background: white; /* Clean white header */
  color: #1f2937;
  padding: 4rem 0 2rem;
  margin-bottom: 3rem;
  text-align: center;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #111827;
  
  .highlight {
    color: #00B1E6; /* Cyan brand color */
  }
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
}

/* Steps Grid */
.steps-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2rem;
  margin-bottom: 4rem;
  align-items: start;
}

/* Step Item Styling (Copied & Adapted from Landing.vue) */
.step-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.step-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  &.step-blue { background: #00B1E6; }
  &.step-orange { background: #f97316; }
  &.step-green { background: #10b981; }
  &.step-purple { background: #9333ea; }
  &.step-red { background: #ef4444; }
  
  svg {
    width: 28px;
    height: 28px;
  }
}

.step-number {
  position: absolute;
  top: 45px;
  right: calc(50% - 45px); /* Adjusted for visual balance */
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
  color: #374151;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.step-title {
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  color: #111827;
  min-height: 2.5rem; /* Ensure alignment even if title wraps */
  display: flex;
  align-items: center;
}

.step-desc {
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
}

/* Tip Box */
.tip-box {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.9rem;
  max-width: 600px;
  margin: 0 auto;
}

.text-center { text-align: center; }

/* Responsive */
@media (max-width: 768px) {
  .steps-container {
     grid-template-columns: 1fr; /* Stack on mobile/tablet portrait */
     gap: 3rem;
  }
}

a {
  color: #3b82f6;
  text-decoration: underline;
  &:hover {
    color: #1d4ed8;
  }
}
</style>
