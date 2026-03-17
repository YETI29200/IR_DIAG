/**
 * Validation utilities
 * Provides reusable validation functions
 */

import { APP_CONFIG } from '../config/app.config'

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
    return password.length >= APP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
    if (typeof value === 'string') {
        return value.trim().length > 0
    }
    return value !== null && value !== undefined
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
    return file.size <= APP_CONFIG.VALIDATION.MAX_FILE_SIZE
}

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
    return (APP_CONFIG.VALIDATION.ALLOWED_FILE_TYPES as readonly string[]).includes(file.type)
}

/**
 * Validate phone number (French format)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

export default {
    isValidEmail,
    isValidPassword,
    isRequired,
    isValidFileSize,
    isValidFileType,
    isValidPhone,
    isValidUrl,
    sanitizeString,
}
