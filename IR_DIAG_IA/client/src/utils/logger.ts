/**
 * Production-ready logging utility
 * Automatically disables debug logs in production
 */

const isDevelopment = import.meta.env.DEV

export const logger = {
    /**
     * Debug logs - only shown in development
     */
    debug: (...args: any[]) => {
        if (isDevelopment) {
            console.log('[DEBUG]', ...args)
        }
    },

    /**
     * Info logs - shown in all environments
     */
    info: (...args: any[]) => {
        console.log('[INFO]', ...args)
    },

    /**
     * Warning logs - shown in all environments
     */
    warn: (...args: any[]) => {
        console.warn('[WARN]', ...args)
    },

    /**
     * Error logs - shown in all environments
     */
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args)
    }
}

export default logger
