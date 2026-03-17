// Route definitions
import Landing from '../pages/Landing.vue'
import Auth from '../pages/Auth.vue'
import Dashboard from '../pages/admin/Dashboard.vue'
import MissionNew from '../pages/admin/MissionNew.vue'
import MissionDetails from '../pages/admin/MissionDetails.vue'
import ConsolidatedView from '../pages/admin/ConsolidatedView.vue'
import FlashDashboard from '../pages/admin/FlashDashboard.vue'
import Questionnaire from '../pages/Questionnaire.vue'
import Results from '../pages/Results.vue'
import ReportPreview from '../pages/ReportPreview.vue'
import PrintReport from '../pages/PrintReport.vue'
import Documentation from '../pages/Documentation.vue'

export const routes = [
  { path: '/', component: Landing },
  { path: '/auth', component: Auth },
  { path: '/documentation', component: Documentation },
  { path: '/admin/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/admin/consolidated', component: ConsolidatedView, meta: { requiresAuth: true } },
  { path: '/admin/flash-analytics', component: FlashDashboard, meta: { requiresAuth: true } },
  { path: '/admin/missions/new', component: MissionNew, meta: { requiresAuth: true } },
  { path: '/admin/missions/:id', component: MissionDetails, meta: { requiresAuth: true } },
  { path: '/questionnaire', component: Questionnaire }, // Route simple pour les liens
  { path: '/questionnaire/:type/:missionId', component: Questionnaire },
  { path: '/results', component: Results },
  { path: '/report/:missionId', component: ReportPreview, meta: { requiresAuth: true } },
  { path: '/print-report', component: PrintReport }
]

