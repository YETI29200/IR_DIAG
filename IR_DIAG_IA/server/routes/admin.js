// Admin routes (backup, etc.)
import { getDb } from '../db/index.js'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = join(__dirname, '../../data/diagnostic.db')
const BACKUP_DIR = join(__dirname, '../../data/backups')
const MAX_BACKUPS = 10

function formatDate(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function isAdmin(req) {
  // Check roles in header (sent by frontend from localStorage)
  const rolesHeader = req.headers['x-user-roles']
  if (rolesHeader) {
    try {
      const roles = JSON.parse(rolesHeader)
      return Array.isArray(roles) && roles.includes('admin')
    } catch {}
  }
  // Also accept if Authorization header is present (basic auth check)
  return !!req.headers.authorization
}

export default async function adminRoutes(req, res, url, body) {

  // POST /api/admin/backup — Crée une sauvegarde de la base de données
  if (req.method === 'POST' && url.pathname === '/api/admin/backup') {
    if (!isAdmin(req)) {
      res.writeHead(403, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Accès refusé' }))
      return
    }

    try {
      mkdirSync(BACKUP_DIR, { recursive: true })

      const date = formatDate(new Date())
      const backupFile = join(BACKUP_DIR, `diagnostic_${date}.db`)

      // Checkpoint WAL avant copie
      const db = getDb()
      try { db.pragma('wal_checkpoint(FULL)') } catch {}

      copyFileSync(DB_PATH, backupFile)

      // Compter les enregistrements
      let stats = {}
      try {
        stats = {
          consultants: db.prepare('SELECT COUNT(*) as n FROM consultants').get()?.n ?? 0,
          missions: db.prepare('SELECT COUNT(*) as n FROM missions').get()?.n ?? 0,
          flash_diagnostics: db.prepare('SELECT COUNT(*) as n FROM flash_diagnostics').get()?.n ?? 0,
        }
      } catch {}

      // Supprimer les anciennes sauvegardes (garder MAX_BACKUPS)
      const backups = readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('diagnostic_') && f.endsWith('.db') && !f.includes('restore'))
        .map(f => ({ name: f, time: statSync(join(BACKUP_DIR, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time)

      if (backups.length > MAX_BACKUPS) {
        backups.slice(MAX_BACKUPS).forEach(b => {
          try { unlinkSync(join(BACKUP_DIR, b.name)) } catch {}
        })
      }

      // Retourner la liste des sauvegardes disponibles
      const availableBackups = readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.db'))
        .map(f => {
          const s = statSync(join(BACKUP_DIR, f))
          return { name: f, size: s.size, date: s.mtime.toISOString() }
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: true,
        backup: backupFile,
        filename: `diagnostic_${date}.db`,
        stats,
        availableBackups
      }))
    } catch (error) {
      console.error('Backup error:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Erreur lors de la sauvegarde', detail: error.message }))
    }
    return
  }

  // GET /api/admin/backups — Liste les sauvegardes disponibles
  if (req.method === 'GET' && url.pathname === '/api/admin/backups') {
    if (!isAdmin(req)) {
      res.writeHead(403, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Accès refusé' }))
      return
    }

    try {
      mkdirSync(BACKUP_DIR, { recursive: true })
      const backups = existsSync(BACKUP_DIR)
        ? readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.db'))
            .map(f => {
              const s = statSync(join(BACKUP_DIR, f))
              return { name: f, size: s.size, date: s.mtime.toISOString() }
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        : []

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ backups }))
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: error.message }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}
