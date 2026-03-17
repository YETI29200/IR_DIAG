/**
 * Formatting utilities
 * Provides consistent data formatting across the application
 */

/**
 * Format date to French locale
 */
export function formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'Non renseigné'

    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString
        if (isNaN(date.getTime())) return 'Date invalide'

        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    } catch {
        return 'Date invalide'
    }
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return 'Non renseigné'

    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString
        if (isNaN(date.getTime())) return 'Date invalide'

        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return 'Date invalide'
    }
}

/**
 * Format number with French locale
 */
export function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return '0'
    return num.toLocaleString('fr-FR')
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0%'
    return `${Math.round(value)}%`
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Format phone number (French format)
 */
export function formatPhone(phone: string): string {
    if (!phone) return ''

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')

    // Format as XX XX XX XX XX
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
    }

    return phone
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return `${first}${last}`
}

/**
 * Calculate working days between two dates (excluding weekends)
 */
export function calculateWorkingDays(startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): number | null {
    if (!startDate || !endDate) return null

    try {
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

        // Set hours to midnight to compare days correctly
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)

        // If start date is after end date, we invert them and result will be multiplied by -1
        // Usually, duration is strictly positive or 0
        if (start > end) return 0

        let count = 0
        const current = new Date(start)

        while (current <= end) {
            const dayOfWeek = current.getDay()
            // 0 = Sunday, 6 = Saturday
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++
            }
            current.setDate(current.getDate() + 1)
        }

        // Return number of working days covered by the interval.
        // If start and end are the same working day, it counts as 1 day. 
        // Some prefer duration as count - 1 if it's "time elapsed", but we return count itself.
        // Or actually, duration between dates mathematically is end - start, so same day is 0 duration.
        // We will return `count - 1` if count > 0, so that Monday to Monday is 0 days later, Monday to Tuesday is 1 day.
        return Math.max(0, count - 1)
    } catch {
        return null
    }
}

export default {
    formatDate,
    formatDateTime,
    formatNumber,
    formatPercentage,
    formatFileSize,
    truncate,
    capitalize,
    formatPhone,
    getInitials,
    calculateWorkingDays,
}
