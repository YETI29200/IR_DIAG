/**
 * Error handling utilities
 * Provides consistent error handling across the application
 */

import logger from './logger'

export interface AppError {
    message: string
    code?: string
    details?: any
}

/**
 * Parse API error response
 */
export async function parseApiError(response: Response): Promise<AppError> {
    try {
        const data = await response.json()
        return {
            message: data.error || data.message || 'Une erreur est survenue',
            code: data.code,
            details: data.details,
        }
    } catch {
        return {
            message: `Erreur ${response.status}: ${response.statusText}`,
            code: String(response.status),
        }
    }
}

/**
 * Handle fetch errors
 */
export function handleFetchError(error: unknown): AppError {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            message: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
            code: 'NETWORK_ERROR',
        }
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            details: error,
        }
    }

    return {
        message: 'Une erreur inconnue est survenue',
        details: error,
    }
}

/**
 * Safe API call wrapper
 */
export async function safeApiCall<T>(
    apiCall: () => Promise<T>,
    errorMessage = 'Une erreur est survenue'
): Promise<{ data: T | null; error: AppError | null }> {
    try {
        const data = await apiCall()
        return { data, error: null }
    } catch (error) {
        logger.error(errorMessage, error)
        return {
            data: null,
            error: handleFetchError(error),
        }
    }
}

/**
 * Display user-friendly error message
 */
export function getUserFriendlyError(error: AppError): string {
    // Map common error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
        '401': 'Votre session a expiré. Veuillez vous reconnecter.',
        '403': "Vous n'avez pas les permissions nécessaires.",
        '404': 'Ressource non trouvée.',
        '500': 'Erreur serveur. Veuillez réessayer plus tard.',
        'NETWORK_ERROR': 'Problème de connexion. Vérifiez votre réseau.',
    }

    return error.code && errorMessages[error.code]
        ? errorMessages[error.code]
        : error.message
}

export default {
    parseApiError,
    handleFetchError,
    safeApiCall,
    getUserFriendlyError,
}
