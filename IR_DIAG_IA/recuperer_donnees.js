// Script de récupération des données — à exécuter sur Windows
// Usage : node recuperer_donnees.js
// Emplacement : C:\Users\denia\IR_DIAG\IR_DIAG_IA\

import Database from 'better-sqlite3'
import { existsSync, copyFileSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'data', 'diagnostic.db')
const WAL_PATH = join(__dirname, 'data', 'diagnostic.db-wal')

console.log('=== DIAGNOSTIC BASE DE DONNÉES IR_DIAG ===\n')
console.log('Fichier DB  :', DB_PATH)
if (existsSync(WAL_PATH)) {
  console.log('WAL existe  : OUI (' + (statSync(WAL_PATH).size / 1024).toFixed(0) + ' Ko)')
} else {
  console.log('WAL existe  : NON')
}

// Sauvegarder d'abord
const backup = DB_PATH + '.avant_recuperation'
copyFileSync(DB_PATH, backup)
console.log('\n✅ Sauvegarde créée :', backup)

// Ouvrir la base en forçant la lecture du WAL
console.log('\nOuverture de la base avec lecture WAL...')
const db = new Database(DB_PATH)

// Forcer un checkpoint FULL pour intégrer tout le WAL dans la base principale
console.log('Checkpoint WAL en cours...')
const checkpoint = db.pragma('wal_checkpoint(FULL)')
console.log('Résultat checkpoint :', JSON.stringify(checkpoint))

// Compter toutes les tables
console.log('\n=== CONTENU DE LA BASE ===')
const tables = ['consultants', 'missions', 'flash_diagnostics', 'sessions', 'responses', 'recommendations']
for (const table of tables) {
  try {
    const count = db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get()
    console.log(`  ${table}: ${count.n} enregistrements`)
  } catch (e) {
    console.log(`  ${table}: table introuvable`)
  }
}

// Détail des flash diagnostics
console.log('\n=== FLASH DIAGNOSTICS (détail) ===')
try {
  const flashes = db.prepare(`
    SELECT id, organization_name, created_at, status
    FROM flash_diagnostics
    ORDER BY created_at DESC
    LIMIT 20
  `).all()
  if (flashes.length === 0) {
    console.log('  Aucun flash diagnostic trouvé dans la base.')
  } else {
    flashes.forEach(f => console.log(`  [${f.id}] ${f.organization_name} — ${f.status} — ${f.created_at}`))
  }
} catch (e) {
  console.log('  Erreur :', e.message)
}

// Détail des missions
console.log('\n=== MISSIONS (détail) ===')
try {
  const missions = db.prepare(`
    SELECT id, organization_name, status, created_at
    FROM missions
    ORDER BY created_at DESC
    LIMIT 20
  `).all()
  if (missions.length === 0) {
    console.log('  Aucune mission trouvée dans la base.')
  } else {
    missions.forEach(m => console.log(`  [${m.id}] ${m.organization_name} — ${m.status} — ${m.created_at}`))
  }
} catch (e) {
  console.log('  Erreur :', e.message)
}

db.close()
console.log('\n=== FIN DU DIAGNOSTIC ===')
console.log('\nSi les données sont toujours manquantes :')
console.log('  Cherchez une autre base avec : where /R C:\\Users\\denia diagnostic.db')
console.log('\nRelancez start-servers.bat pour redémarrer les serveurs.')
