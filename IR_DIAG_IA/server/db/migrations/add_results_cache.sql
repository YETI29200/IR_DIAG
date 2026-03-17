-- Migration: Add results cache table for performance optimization
-- This table caches calculated results to avoid expensive recalculations

CREATE TABLE IF NOT EXISTS results_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    service_id INTEGER, -- NULL for global mission results
    cache_key TEXT NOT NULL, -- Hash of responses count and last modification
    cached_data TEXT NOT NULL, -- JSON string of calculated results
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES mission_services(id) ON DELETE CASCADE,
    UNIQUE(mission_id, service_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_results_cache_mission ON results_cache(mission_id);
CREATE INDEX IF NOT EXISTS idx_results_cache_service ON results_cache(service_id);
CREATE INDEX IF NOT EXISTS idx_results_cache_key ON results_cache(cache_key);

