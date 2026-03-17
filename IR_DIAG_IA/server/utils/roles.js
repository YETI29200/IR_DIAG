// Role utilities
import { getDb } from '../db/index.js'

/**
 * Get all roles for a consultant
 * @param {number} consultantId
 * @returns {Promise<string[]>} Array of role names
 */
export function getConsultantRoles(consultantId) {
  const db = getDb()
  const roles = db.prepare(`
    SELECT role
    FROM user_roles
    WHERE consultant_id = ?
  `).all(consultantId)
  
  return roles.map(r => r.role)
}

/**
 * Check if a consultant has a specific role
 * @param {number} consultantId
 * @param {string} role
 * @returns {boolean}
 */
export function hasRole(consultantId, role) {
  const roles = getConsultantRoles(consultantId)
  return roles.includes(role)
}

/**
 * Check if a consultant is an admin
 * @param {number} consultantId
 * @returns {boolean}
 */
export function isAdmin(consultantId) {
  return hasRole(consultantId, 'admin')
}

/**
 * Check if a consultant is a consultant (chef de projet)
 * @param {number} consultantId
 * @returns {boolean}
 */
export function isConsultant(consultantId) {
  return hasRole(consultantId, 'consultant')
}

