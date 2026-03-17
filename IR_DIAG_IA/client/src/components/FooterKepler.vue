<template>
  <footer class="kepler-footer">
    <div class="container py-12 mt-20">
      <div class="footer-grid">
        <!-- Logo and About -->
        <div class="footer-col">
          <span class="footer-logo font-title">
            Diagnostic <span class="text-secondary">IA & DATA</span>
          </span>
          <p class="footer-description">
            Plateforme d'auto-évaluation de la maturité numérique pour les entreprises du Grand Ouest, propulsée par l'EDIH Bretagne et Pays de la Loire.
          </p>
        </div>
        
        <!-- Navigation -->
        <div class="footer-col">
          <h4 class="col-title">Navigation</h4>
          <ul class="col-links">
            <li><router-link to="/" class="footer-link">ACCUEIL</router-link></li>
            <li><router-link to="/admin/dashboard" class="footer-link">MES MISSIONS</router-link></li>
            <li><router-link to="/admin/consolidated" class="footer-link">RAPPORTS GLOBAUX</router-link></li>
            <li><router-link to="/documentation" class="footer-link flex items-center gap-2">
              <span>DOCUMENTATION</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </router-link></li>
          </ul>
        </div>
        
        <!-- Links -->
        <div class="footer-col">
          <h4 class="col-title">Partenaires</h4>
          <p class="contact-info">
            Images & Réseaux<br />
            EDIH Bretagne et Pays de la Loire<br />
            <span class="phone">Accompagnement Transformation Numérique</span>
          </p>
        </div>
      </div>
      
      <div class="footer-bottom">
        &copy; {{ new Date().getFullYear() }} Images & Réseaux. Plateforme de diagnostic IA & Data.
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.kepler-footer {
  background-color: #111827; // bg-gray-900
  color: white;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.mt-20 { margin-top: 5rem; }

.footer-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 3rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.footer-logo {
  font-size: 1.5rem;
  letter-spacing: -0.05em;
  display: block;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.text-secondary {
  color: #00B1E6; // cyan-primary
}

.footer-description {
  color: #9CA3AF; // text-gray-400
  font-size: 0.875rem;
  line-height: 1.5;
}

.col-title {
  border-bottom: 1px solid #374151; // border-gray-700
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.875rem;
}

.col-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-link {
  color: #9CA3AF;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
  &:hover {
    color: white;
  }
}

.contact-info {
  color: #9CA3AF;
  font-size: 0.875rem;
  line-height: 1.5;
}

.phone {
  display: block;
  margin-top: 0.5rem;
  font-weight: 700;
  color: #00B1E6;
}

.footer-bottom {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #1F2937; // border-gray-800
  text-align: center;
  font-size: 0.75rem;
  color: #6B7280; // text-gray-500
}
</style>
