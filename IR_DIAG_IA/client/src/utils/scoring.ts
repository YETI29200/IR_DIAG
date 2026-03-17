import type { DimensionScore } from '@shared/types'

export function normalizeScore(score: number): number {
    return Math.min(100, Math.max(0, score))
}

export function normalizeDimensionScore(score: DimensionScore): DimensionScore {
    const normalized = {
        ...score,
        score: normalizeScore(score.score)
    }
    if ((score as any).median !== undefined) {
        (normalized as any).median = normalizeScore((score as any).median)
    }
    return normalized
}

export function normalizeDimensionKeyFrontend(value: string | null | undefined): string | null {
    if (value == null) return null
    let s = String(value).trim()

    // Remove surrounding quotes
    while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1).trim()
    }
    s = s.replace(/^["']+|["']+$/g, '').trim()

    // Normalize
    s = s.toLowerCase().trim()
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    s = s.replace(/\s+/g, '_').trim()

    const map: Record<string, string> = {
        'strategie_ia': 'strategie',
        'gouvernance_ia': 'gouvernance',
        'cas_d_usage': 'cas_usage',
        'competences_ia': 'competences',
        'culture_acculturation': 'culture',
        'culture_ia': 'culture',
        'outils_techno': 'technologie',
        'outils_et_technologie': 'technologie',
        'techno_outils': 'technologie',
        'eco_systeme': 'ecosysteme',
        'ecosysteme_ia': 'ecosysteme',
        'conformite_ethique': 'ethique',
        'ethique_responsable': 'ethique',
        'donnees': 'donnees',
        'infrastructure_donnees': 'donnees'
    }

    return map[s] || s
}
