// Cache utility for results calculations
// Uses a hash-based approach to detect when cached data is stale

import crypto from 'crypto'

/**
 * Calculate a cache key based on responses metadata
 * This key changes when responses are added, modified, or deleted
 */
export function calculateCacheKey(db, missionId, serviceId = null) {
  // Get response count and last modification time for this mission/service
  let query
  let params
  
  if (serviceId) {
    // Service-specific cache key
    query = `
      SELECT 
        COUNT(*) as response_count,
        MAX(r.created_at) as last_modified
      FROM responses r
      JOIN sessions s ON r.session_id = s.id
      WHERE s.mission_id = ? AND s.service_id = ?
    `
    params = [missionId, serviceId]
  } else {
    // Global mission cache key
    query = `
      SELECT 
        COUNT(*) as response_count,
        MAX(r.created_at) as last_modified
      FROM responses r
      JOIN sessions s ON r.session_id = s.id
      WHERE s.mission_id = ?
    `
    params = [missionId]
  }
  
  const result = db.prepare(query).get(...params)
  const responseCount = result?.response_count || 0
  const lastModified = result?.last_modified || ''
  
  // Create hash from count + last modified time
  const hashInput = `${missionId}:${serviceId || 'global'}:${responseCount}:${lastModified}`
  return crypto.createHash('md5').update(hashInput).digest('hex')
}

/**
 * Get cached results if available and valid
 */
export function getCachedResults(db, missionId, serviceId = null) {
  const cacheKey = calculateCacheKey(db, missionId, serviceId)
  
  const cached = db.prepare(`
    SELECT cached_data, cache_key, updated_at
    FROM results_cache
    WHERE mission_id = ? AND (service_id = ? OR (service_id IS NULL AND ? IS NULL))
  `).get(missionId, serviceId || null, serviceId || null)
  
  if (!cached) {
    return null
  }
  
  // Check if cache key matches (data hasn't changed)
  if (cached.cache_key !== cacheKey) {
    // Cache is stale, delete it
    db.prepare(`
      DELETE FROM results_cache
      WHERE mission_id = ? AND (service_id = ? OR (service_id IS NULL AND ? IS NULL))
    `).run(missionId, serviceId || null, serviceId || null)
    return null
  }
  
  // Cache is valid, return parsed data
  try {
    return JSON.parse(cached.cached_data)
  } catch (e) {
    console.error('[Cache] Error parsing cached data:', e)
    return null
  }
}

/**
 * Store results in cache
 */
export function setCachedResults(db, missionId, serviceId, data) {
  const cacheKey = calculateCacheKey(db, missionId, serviceId)
  
  try {
    const cachedData = JSON.stringify(data)
    
    // Use INSERT OR REPLACE to update if exists
    db.prepare(`
      INSERT OR REPLACE INTO results_cache (mission_id, service_id, cache_key, cached_data, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(missionId, serviceId || null, cacheKey, cachedData)
  } catch (e) {
    console.error('[Cache] Error storing cached data:', e)
  }
}

/**
 * Invalidate cache for a mission (and optionally a specific service)
 * Called when responses are added, modified, or deleted
 */
export function invalidateCache(db, missionId, serviceId = null) {
  if (serviceId) {
    // Invalidate specific service cache
    db.prepare(`
      DELETE FROM results_cache
      WHERE mission_id = ? AND service_id = ?
    `).run(missionId, serviceId)
  } else {
    // Invalidate all caches for this mission (global + all services)
    db.prepare(`
      DELETE FROM results_cache
      WHERE mission_id = ?
    `).run(missionId)
  }
}

/**
 * Initialize cache table if it doesn't exist
 * This is a safety check in case migration wasn't run
 */
export function ensureCacheTable(db) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS results_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id INTEGER NOT NULL,
        service_id INTEGER,
        cache_key TEXT NOT NULL,
        cached_data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES mission_services(id) ON DELETE CASCADE,
        UNIQUE(mission_id, service_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_results_cache_mission ON results_cache(mission_id);
      CREATE INDEX IF NOT EXISTS idx_results_cache_service ON results_cache(service_id);
      CREATE INDEX IF NOT EXISTS idx_results_cache_key ON results_cache(cache_key);
    `)
  } catch (e) {
    console.error('[Cache] Error ensuring cache table exists:', e)
  }
}

