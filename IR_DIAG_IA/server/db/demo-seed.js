/**
 * Script de données de démonstration
 * Génère des missions et des flash diagnostics réalistes pour tester l'interface
 *
 * Usage: npm run db:demo
 */
import { getDmaDb, getFlashDb, closeDb } from './index.js'
import { scryptSync, randomBytes } from 'crypto'

const dmaDb = getDmaDb()
const flashDb = getFlashDb()

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}

function dateOffset(daysAgo, hoursOffset = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(d.getHours() - hoursOffset)
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

console.log('🌱 Création des données de démonstration...\n')

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADMIN / CONSULTANT
// ─────────────────────────────────────────────────────────────────────────────

let adminId
const existingAdmin = dmaDb.prepare("SELECT id FROM consultants WHERE email = ?").get('admin@images-reseaux.fr')

if (existingAdmin) {
  adminId = existingAdmin.id
  console.log('✅ Compte admin existant (admin@images-reseaux.fr)')
} else {
  const pw = hashPassword('admin123')
  const r = dmaDb.prepare(`
    INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin@images-reseaux.fr', pw.hash, pw.salt, 'Admin', 'System', 'Administrateur')
  adminId = r.lastInsertRowid
  dmaDb.prepare("INSERT INTO user_roles (consultant_id, role) VALUES (?, 'admin')").run(adminId)
  dmaDb.prepare("INSERT INTO user_roles (consultant_id, role) VALUES (?, 'consultant')").run(adminId)
  console.log('✅ Compte admin créé (admin@images-reseaux.fr / admin123)')
}

let consultantId
const existingConsultant = dmaDb.prepare("SELECT id FROM consultants WHERE email = ?").get('consultant@images-reseaux.fr')

if (existingConsultant) {
  consultantId = existingConsultant.id
  console.log('✅ Compte consultant existant (consultant@images-reseaux.fr)')
} else {
  const pw = hashPassword('consultant123')
  const r = dmaDb.prepare(`
    INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('consultant@images-reseaux.fr', pw.hash, pw.salt, 'Sophie', 'Leroux', 'Consultante Senior')
  consultantId = r.lastInsertRowid
  dmaDb.prepare("INSERT INTO user_roles (consultant_id, role) VALUES (?, 'consultant')").run(consultantId)
  console.log('✅ Compte consultant créé (consultant@images-reseaux.fr / consultant123)')
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MISSIONS
// ─────────────────────────────────────────────────────────────────────────────

const missionsData = [
  {
    organization_name: 'Groupe Bretagne Numérique',
    sector: 'Technologies de l\'information',
    employees: 320,
    questionnaire_type: 'full',
    status: 'closed',
    maturity_percent: 72,
    created_at: dateOffset(120),
    in_progress_date: dateOffset(115),
    closure_date: dateOffset(60),
    consultantId: adminId,
    services: [
      { name: 'Direction Générale', code: 'DG001', contacts: [{ first_name: 'Pierre', last_name: 'Tanguy', role: 'Directeur Général', email: 'p.tanguy@bretagne-num.fr' }] },
      { name: 'DSI', code: 'DSI001', contacts: [{ first_name: 'Marie', last_name: 'Leblanc', role: 'DSI', email: 'm.leblanc@bretagne-num.fr' }] },
      { name: 'RH', code: 'RH001', contacts: [{ first_name: 'Julien', last_name: 'Morin', role: 'DRH', email: 'j.morin@bretagne-num.fr' }] },
    ]
  },
  {
    organization_name: 'Biotech Armor',
    sector: 'Santé',
    employees: 85,
    questionnaire_type: 'full',
    status: 'in_progress',
    maturity_percent: null,
    created_at: dateOffset(45),
    in_progress_date: dateOffset(40),
    closure_date: null,
    consultantId: consultantId,
    services: [
      { name: 'Direction Médicale', code: 'MED001', contacts: [{ first_name: 'Isabelle', last_name: 'Dupré', role: 'Directrice Médicale', email: 'i.dupre@biotech-armor.fr' }] },
      { name: 'R&D', code: 'RD001', contacts: [{ first_name: 'Thomas', last_name: 'Bernard', role: 'Responsable R&D', email: 't.bernard@biotech-armor.fr' }] },
    ]
  },
  {
    organization_name: 'Coopérative Agricole du Trégor',
    sector: 'Agriculture',
    employees: 150,
    questionnaire_type: 'flash',
    status: 'in_progress',
    maturity_percent: null,
    created_at: dateOffset(30),
    in_progress_date: dateOffset(28),
    closure_date: null,
    consultantId: adminId,
    services: [
      { name: 'Direction', code: 'DIR001', contacts: [{ first_name: 'Alain', last_name: 'Cariou', role: 'Directeur', email: 'a.cariou@coop-tregor.fr' }] },
    ]
  },
  {
    organization_name: 'Lannion Technopole',
    sector: 'Enseignement & Recherche',
    employees: 45,
    questionnaire_type: 'full',
    status: 'preparation',
    maturity_percent: null,
    created_at: dateOffset(10),
    in_progress_date: null,
    closure_date: null,
    consultantId: consultantId,
    services: [
      { name: 'Direction', code: 'DIR001', contacts: [{ first_name: 'Nathalie', last_name: 'Perrin', role: 'Directrice', email: 'n.perrin@lannion-technopole.fr' }] },
      { name: 'Innovation', code: 'INN001', contacts: [{ first_name: 'Romain', last_name: 'Guyader', role: 'Responsable Innovation', email: 'r.guyader@lannion-technopole.fr' }] },
    ]
  },
  {
    organization_name: 'Armor Pêche & Mer',
    sector: 'Agroalimentaire',
    employees: 210,
    questionnaire_type: 'full',
    status: 'closed',
    maturity_percent: 41,
    created_at: dateOffset(200),
    in_progress_date: dateOffset(195),
    closure_date: dateOffset(140),
    consultantId: adminId,
    services: [
      { name: 'Production', code: 'PROD001', contacts: [{ first_name: 'François', last_name: 'Le Gall', role: 'Directeur Production', email: 'f.legall@armor-peche.fr' }] },
      { name: 'Logistique', code: 'LOG001', contacts: [{ first_name: 'Claire', last_name: 'Riou', role: 'Responsable Logistique', email: 'c.riou@armor-peche.fr' }] },
    ]
  },
  {
    organization_name: 'CCI Côtes d\'Armor',
    sector: 'Services aux entreprises',
    employees: 120,
    questionnaire_type: 'full',
    status: 'in_progress',
    maturity_percent: null,
    created_at: dateOffset(20),
    in_progress_date: dateOffset(18),
    closure_date: null,
    consultantId: consultantId,
    services: [
      { name: 'Direction Générale', code: 'DG001', contacts: [{ first_name: 'Eric', last_name: 'Breton', role: 'Président', email: 'e.breton@cci22.fr' }] },
      { name: 'Numérique', code: 'NUM001', contacts: [{ first_name: 'Lucie', last_name: 'Tanguy', role: 'Responsable Numérique', email: 'l.tanguy@cci22.fr' }] },
    ]
  },
]

console.log('\n📋 Création des missions...')

for (const m of missionsData) {
  try {
    const missionResult = dmaDb.prepare(`
      INSERT INTO missions (consultant_id, organization_name, sector, employees, questionnaire_type,
        status, maturity_percent, created_at, in_progress_date, closure_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      m.consultantId, m.organization_name, m.sector, m.employees,
      m.questionnaire_type, m.status, m.maturity_percent,
      m.created_at, m.in_progress_date, m.closure_date
    )
    const missionId = missionResult.lastInsertRowid

    for (const svc of m.services) {
      const svcResult = dmaDb.prepare(`
        INSERT INTO mission_services (mission_id, name, code, unique_link, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(missionId, svc.name, svc.code,
        `/questionnaire/${m.questionnaire_type}/${missionId}?service=${svc.code}`,
        m.created_at
      )
      const serviceId = svcResult.lastInsertRowid

      for (let i = 0; i < svc.contacts.length; i++) {
        const c = svc.contacts[i]
        dmaDb.prepare(`
          INSERT INTO mission_contacts (mission_id, service_id, first_name, last_name, role, email, is_primary, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(missionId, serviceId, c.first_name, c.last_name, c.role, c.email, i === 0 ? 1 : 0, m.created_at)
      }
    }

    console.log(`  ✅ Mission "${m.organization_name}" (${m.status})`)
  } catch (err) {
    console.log(`  ⚠️  Mission "${m.organization_name}" ignorée: ${err.message}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FLASH DIAGNOSTICS PUBLICS
// ─────────────────────────────────────────────────────────────────────────────

const sectors = [
  'Technologies de l\'information', 'Santé', 'Agriculture', 'Agroalimentaire',
  'Industrie', 'Commerce', 'Services aux entreprises', 'Enseignement & Recherche',
  'Tourisme', 'Transport & Logistique', 'Énergie', 'Construction & BTP'
]

const employeeSizes = [
  'TPE (< 10 sal.)', 'PME (10-250 sal.)', 'ETI (250-5000 sal.)', 'Grande entreprise (> 5000 sal.)'
]

const regions = [
  { region: 'Bretagne', department: 'Côtes-d\'Armor', postal: '22000' },
  { region: 'Bretagne', department: 'Finistère', postal: '29000' },
  { region: 'Bretagne', department: 'Ille-et-Vilaine', postal: '35000' },
  { region: 'Bretagne', department: 'Morbihan', postal: '56000' },
  { region: 'Pays de la Loire', department: 'Loire-Atlantique', postal: '44000' },
  { region: 'Normandie', department: 'Calvados', postal: '14000' },
  { region: 'Île-de-France', department: 'Paris', postal: '75000' },
]

const organizations = [
  'Agro Armor', 'BioMer Bretagne', 'Tech Trégor', 'Numérique Côtes d\'Armor',
  'Pêcheries du Nord', 'Fromagerie Artisanale', 'Cabinet RH Ouest',
  'Startup Lannion', 'SARL Dupont & Fils', 'Clinique du Guoët',
  'Garage Auto Leblanc', 'Boulangerie Martin', 'Cabinet d\'Avocats Riou',
  'École Privée Saint-Joseph', 'Menuiserie Perrin', 'Conserverie Armor',
  'Hôtel Restaurant du Port', 'Ferme des Landes', 'Imprimerie Moderne',
  'Transport Breton Express'
]

// Question keys in order
const questionKeys = [
  'votre_entreprise_utilise_t_elle_actuellement_des_solutions_b',
  'a_quel_niveau_l_ia_est_elle_integree_dans_les_processus_meti',
  'utilisez_vous_l_ia_pour_automatiser_des_taches_repetitives_d',
  'votre_entreprise_a_t_elle_developpe_des_produits_ou_services',
  'votre_entreprise_dispose_t_elle_d_une_infrastructure_de_gest',
  'a_quelle_frequence_vos_donnees_sont_elles_mises_a_jour',
  'votre_entreprise_utilise_t_elle_des_outils_avances_d_analyse',
  'quel_est_le_niveau_de_qualite_de_vos_donnees_fiables_correct',
  'votre_entreprise_dispose_t_elle_de_competences_internes_en_i',
  'avez_vous_un_programme_de_formation_interne_pour_developper_',
  'votre_direction_soutient_elle_activement_l_adoption_de_l_ia_',
  'quelle_est_la_culture_de_votre_entreprise_vis_a_vis_de_l_inn',
  'votre_entreprise_dispose_t_elle_d_une_infrastructure_cloud_a',
  'a_quel_point_votre_infrastructure_informatique_est_elle_secu',
  'votre_entreprise_utilise_t_elle_des_outils_de_devops_automat',
  'votre_infrastructure_peut_elle_facilement_evoluer_pour_repon',
  'votre_entreprise_a_t_elle_une_feuille_de_route_strategique_p',
  'a_quel_point_l_ia_est_elle_consideree_comme_une_priorite_str',
  'votre_entreprise_investit_elle_activement_dans_des_projets_d',
  'comment_evalueriez_vous_la_capacite_de_votre_entreprise_a_in',
]

// Score-based answer generators per question
function generateAnswers(targetScore) {
  const high = targetScore >= 60
  const med = targetScore >= 35
  return {
    [questionKeys[0]]: high ? 'oui' : 'non',
    [questionKeys[1]]: high ? 'fortement_integree' : med ? 'moderement_integree' : 'integration_limitee',
    [questionKeys[2]]: high ? 'oui' : 'non',
    [questionKeys[3]]: high ? 'oui' : 'non',
    [questionKeys[4]]: high || med ? 'oui' : 'non',
    [questionKeys[5]]: high ? 'quotidiennement' : med ? 'hebdomadairement' : 'mensuellement',
    [questionKeys[6]]: high ? 'oui' : 'non',
    [questionKeys[7]]: high ? 'tres_elevee' : med ? 'elevee' : 'moyen',
    [questionKeys[8]]: high ? 'oui' : 'non',
    [questionKeys[9]]: high ? 'oui' : 'non',
    [questionKeys[10]]: high || med ? 'oui' : 'non',
    [questionKeys[11]]: high ? 'tres_favorable' : med ? 'favorable' : 'moyenne',
    [questionKeys[12]]: high || med ? 'oui' : 'non',
    [questionKeys[13]]: high ? 'tres_securisee' : med ? 'securisee' : 'moyennement_securisee',
    [questionKeys[14]]: high ? 'oui' : 'non',
    [questionKeys[15]]: high ? 'oui' : 'non',
    [questionKeys[16]]: high || med ? 'oui' : 'non',
    [questionKeys[17]]: high ? 'tres_elevee' : med ? 'elevee' : 'moyenne',
    [questionKeys[18]]: high ? 'oui' : 'non',
    [questionKeys[19]]: high ? 'tres_elevee' : med ? 'elevee' : 'moyen',
  }
}

function generateDimensionScores(targetScore) {
  const variance = () => Math.round((Math.random() - 0.5) * 25)
  const clamp = (v) => Math.max(0, Math.min(100, v))
  return [
    { id: 'usages_de_lia', label: 'Usages de l\'IA', score: clamp(targetScore + variance()) },
    { id: 'data', label: 'Data', score: clamp(targetScore + variance()) },
    { id: 'competences_culture', label: 'Compétences & Culture', score: clamp(targetScore + variance()) },
    { id: 'infrastructure', label: 'Infrastructure', score: clamp(targetScore + variance()) },
    { id: 'strategie_vision', label: 'Stratégie & Vision', score: clamp(targetScore + variance()) },
  ]
}

function maturityLevel(score) {
  if (score >= 75) return 'Expert'
  if (score >= 50) return 'Avancé'
  if (score >= 25) return 'Initié'
  return 'Débutant'
}

function generateRecommendations(dimScores) {
  return dimScores.map(d => ({
    dimension: d.label,
    score: d.score,
    level: d.score >= 70 ? 'high' : d.score >= 40 ? 'medium' : 'low',
    recommendation: d.score < 40
      ? `Renforcer ${d.label} : définir un plan d'action prioritaire.`
      : d.score < 70
        ? `Consolider ${d.label} : développer les pratiques existantes.`
        : `${d.label} : maintenir le niveau et partager les bonnes pratiques.`
  }))
}

// Spread entries over ~6 months (about 1-2 per week)
const flashEntries = [
  { daysAgo: 170, orgIdx: 0, sector: 0, size: 1, region: 0, score: 25 },
  { daysAgo: 165, orgIdx: 1, sector: 1, size: 2, region: 1, score: 62 },
  { daysAgo: 158, orgIdx: 2, sector: 2, size: 1, region: 0, score: 38 },
  { daysAgo: 152, orgIdx: 3, sector: 3, size: 1, region: 2, score: 71 },
  { daysAgo: 145, orgIdx: 4, sector: 4, size: 2, region: 0, score: 18 },
  { daysAgo: 139, orgIdx: 5, sector: 5, size: 0, region: 3, score: 45 },
  { daysAgo: 132, orgIdx: 6, sector: 6, size: 1, region: 4, score: 58 },
  { daysAgo: 126, orgIdx: 7, sector: 0, size: 0, region: 0, score: 82 },
  { daysAgo: 119, orgIdx: 8, sector: 3, size: 1, region: 1, score: 31 },
  { daysAgo: 113, orgIdx: 9, sector: 1, size: 2, region: 2, score: 65 },
  { daysAgo: 106, orgIdx: 10, sector: 7, size: 1, region: 0, score: 50 },
  { daysAgo: 100, orgIdx: 11, sector: 5, size: 0, region: 3, score: 22 },
  { daysAgo: 93, orgIdx: 12, sector: 6, size: 1, region: 0, score: 74 },
  { daysAgo: 87, orgIdx: 13, sector: 7, size: 2, region: 5, score: 48 },
  { daysAgo: 80, orgIdx: 14, sector: 4, size: 1, region: 0, score: 35 },
  { daysAgo: 74, orgIdx: 15, sector: 3, size: 1, region: 1, score: 67 },
  { daysAgo: 67, orgIdx: 16, sector: 8, size: 0, region: 2, score: 29 },
  { daysAgo: 61, orgIdx: 17, sector: 2, size: 1, region: 3, score: 55 },
  { daysAgo: 54, orgIdx: 18, sector: 9, size: 1, region: 0, score: 42 },
  { daysAgo: 48, orgIdx: 19, sector: 10, size: 2, region: 4, score: 76 },
  { daysAgo: 41, orgIdx: 0, sector: 11, size: 1, region: 0, score: 33 },
  { daysAgo: 35, orgIdx: 1, sector: 0, size: 0, region: 1, score: 60 },
  { daysAgo: 30, orgIdx: 2, sector: 1, size: 1, region: 0, score: 47 },
  { daysAgo: 25, orgIdx: 3, sector: 4, size: 2, region: 6, score: 85 },
  { daysAgo: 22, orgIdx: 4, sector: 2, size: 1, region: 0, score: 20 },
  { daysAgo: 19, orgIdx: 5, sector: 6, size: 0, region: 2, score: 53 },
  { daysAgo: 16, orgIdx: 6, sector: 3, size: 1, region: 0, score: 69 },
  { daysAgo: 13, orgIdx: 7, sector: 0, size: 1, region: 1, score: 41 },
  { daysAgo: 10, orgIdx: 8, sector: 5, size: 2, region: 0, score: 78 },
  { daysAgo: 7, orgIdx: 9, sector: 7, size: 1, region: 3, score: 36 },
  { daysAgo: 5, orgIdx: 10, sector: 4, size: 0, region: 0, score: 62 },
  { daysAgo: 3, orgIdx: 11, sector: 1, size: 1, region: 2, score: 55 },
  { daysAgo: 2, orgIdx: 12, sector: 8, size: 1, region: 0, score: 44 },
  { daysAgo: 1, orgIdx: 13, sector: 2, size: 2, region: 4, score: 70 },
  { daysAgo: 0, orgIdx: 14, sector: 6, size: 1, region: 0, score: 28 },
]

console.log('\n⚡ Création des Flash Diagnostics publics...')

let flashCreated = 0
for (const entry of flashEntries) {
  const org = organizations[entry.orgIdx]
  const sector = sectors[entry.sector]
  const size = employeeSizes[entry.size]
  const loc = regions[entry.region]
  const score = entry.score
  const level = maturityLevel(score)
  const answers = generateAnswers(score)
  const dimScores = generateDimensionScores(score)
  const recos = generateRecommendations(dimScores)
  const globalScore = Math.round(dimScores.reduce((s, d) => s + d.score, 0) / dimScores.length)

  try {
    flashDb.prepare(`
      INSERT INTO flash_diagnostics (
        organization_name, contact_name, contact_email, contact_phone, contact_role,
        employees, sector, postal_code, department, region,
        global_score, maturity_level, answers_json, dimension_scores_json, recommendations_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      org,
      'Contact Demo',
      `contact@${org.toLowerCase().replace(/[^a-z0-9]/g, '-')}.fr`,
      '0296000000',
      'Responsable',
      size, sector,
      loc.postal, loc.department, loc.region,
      globalScore, level,
      JSON.stringify(answers),
      JSON.stringify(dimScores),
      JSON.stringify(recos),
      dateOffset(entry.daysAgo, Math.floor(Math.random() * 8))
    )
    flashCreated++
  } catch (err) {
    console.log(`  ⚠️  Flash diag "${org}" ignoré: ${err.message}`)
  }
}

console.log(`  ✅ ${flashCreated} Flash Diagnostics créés`)

// ─────────────────────────────────────────────────────────────────────────────
// Checkpoint WAL
// ─────────────────────────────────────────────────────────────────────────────
dmaDb.pragma('wal_checkpoint(FULL)')
flashDb.pragma('wal_checkpoint(FULL)')

closeDb()

console.log('\n✅ Données de démonstration créées avec succès !')
console.log('\n📌 Comptes disponibles :')
console.log('  Admin     : admin@images-reseaux.fr / admin123')
console.log('  Consultant: consultant@images-reseaux.fr / consultant123')
console.log(`\n📊 Résumé :`)
console.log(`  - ${missionsData.length} missions (preparation, in_progress, closed)`)
console.log(`  - ${flashCreated} Flash Diagnostics publics`)
console.log('\n▶  Démarrez l\'application : npm run dev')
