/**
 * Application configuration constants
 * Centralized configuration for better maintainability
 */

export const APP_CONFIG = {
    // API Configuration
    API: {
        TIMEOUT: 180000, // 3 minutes
        BASE_URL: '/api',
    },

    // UI Configuration
    UI: {
        ITEMS_PER_PAGE: 20,
        DEBOUNCE_DELAY: 300, // ms
        TOAST_DURATION: 3000, // ms
    },

    // Validation
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 8,
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
    },

    // Feature Flags
    FEATURES: {
        ENABLE_DEBUG_MODE: import.meta.env.DEV,
        ENABLE_ANALYTICS: import.meta.env.PROD,
    },

    // Maturity Score Colors
    MATURITY_COLORS: {
        LOW: '#ef4444',      // 0-25% - Red
        MEDIUM: '#f97316',   // 26-50% - Orange
        HIGH: '#22c55e',     // 51-100% - Green
    },

    // Progress Colors
    PROGRESS_COLORS: {
        LOW: '#ef4444',      // 0-25% - Red
        MEDIUM: '#f97316',   // 26-50% - Orange
        HIGH: '#3b82f6',     // 51-100% - Blue
    },
} as const

export default APP_CONFIG
