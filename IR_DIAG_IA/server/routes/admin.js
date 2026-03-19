// Admin routes (backup, etc.)
import { getDmaDb, getFlashDb, DMA_DB_PATH, FLASH_DB_PATH } from '../db/index.js'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BACKUP_DIR = join(__dirname, '../../data/backups')
const MAX_BACKUPS = 10

function formatDate(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function isAdmin(req) {
  const rolesHeader = req.headers['x-user-roles']
  if (rolesHeader) {
    try {
      const roles = JSON.parse(rolesHeader)
      return Array.isArray(roles) && roles.includes('admin')
    } catch {}
  }
  return !!req.headers.authorization
}

export default async function adminRoutes(req, res, url, body) {

  // POST /api/admin/backup — Sauvegarde des deux bases de données
  if (req.method === 'POST' && url.pathname === '/api/admin/backup') {
    if (!isAdmin(req)) {
      res.writeHead(403, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Accès refusé' }))
      return
    }

    try {
      mkdirSync(BACKUP_DIR, { recursive: true })

      const date = formatDate(new Date())
      const dmaBackupFile = join(BACKUP_DIR, `DMA_${date}.db`)
      const flashBackupFile = join(BACKUP_DIR, `flash_diag_${date}.db`)

      // Checkpoint WAL avant copie
      const dmaDb = getDmaDb()
      const flashDb = getFlashDb()
      try { dmaDb.pragma('wal_checkpoint(FULL)') } catch {}
      try { flashDb.pragma('wal_checkpoint(FULL)') } catch {}

      // Copie des deux bases
      if (existsSync(DMA_DB_PATH)) copyFileSync(DMA_DB_PATH, dmaBackupFile)
      if (existsSync(FLASH_DB_PATH)) copyFileSync(FLASH_DB_PATH, flashBackupFile)

      // Statistiques
      let stats = {}
      try {
        stats = {
          consultants: dmaDb.prepare('SELECT COUNT(*) as n FROM consultants').get()?.n ?? 0,
          missions: dmaDb.prepare('SELECT COUNT(*) as n FROM missions').get()?.n ?? 0,
          flash_diagnostics: flashDb.prepare('SELECT COUNT(*) as n FROM flash_diagnostics').get()?.n ?? 0,
        }
      } catch {}

      // Supprimer les anciennes sauvegardes (garder MAX_BACKUPS par type)
      for (const prefix of ['DMA_', 'flash_diag_']) {
        const backups = readdirSync(BACKUP_DIR)
          .filter(f => f.startsWith(prefix) && f.endsWith('.db'))
          .map(f => ({ name: f, time: statSync(join(BACKUP_DIR, f)).mtimeMs }))
          .sort((a, b) => b.time - a.time)
        if (backups.length > MAX_BACKUPS) {
          backups.slice(MAX_BACKUPS).forEach(b => {
            try { unlinkSync(join(BACKUP_DIR, b.name)) } catch {}
          })
        }
      }

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
        backups: { dma: dmaBackupFile, flash: flashBackupFile },
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
