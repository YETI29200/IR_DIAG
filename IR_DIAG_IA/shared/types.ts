// Shared types between client and server

export interface Consultant {
  id: number
  email: string
  firstName: string
  lastName: string
  jobTitle: string | null
  phone: string | null
  signatureHtml: string | null
  createdAt: string
  roles?: string[]
}

export interface Mission {
  id: number
  consultantId: number
  organizationName: string
  sector: string | null
  employees: number | null
  questionnaireType: 'flash' | 'full'
  status: 'preparation' | 'in_progress' | 'suspended' | 'closed'
  closureDate: string | null
  summary: string | null
  maturityPercent: number | null
  respondentsPercent: number | null
  satisfactionStars: number | null
  createdAt: string
  // Statistics
  contactsCount?: number
  respondentsCount?: number
  completedCount?: number
  servicesCount?: number
  // Admin-only fields
  consultantName?: string
  consultantEmail?: string
}

export interface MissionService {
  id: number
  missionId: number
  name: string
  code: string
  uniqueLink: string
  createdAt: string
}

export interface MissionContact {
  id: number
  missionId: number
  serviceId: number | null
  firstName: string
  lastName: string
  role: string | null
  email: string
  phone: string | null
  isPrimary: boolean
  createdAt: string
}

export interface Session {
  id: number
  missionId: number
  serviceId: number | null
  anonymousToken: string
  startedAt: string
  completedAt: string | null
}

export interface Response {
  id: number
  sessionId: number
  questionId: string
  dimension: string
  answerValue: number
  createdAt: string
}

export interface Recommendation {
  id: number
  missionId: number
  serviceId: number | null
  sessionId: number | null
  payloadJson: string
  status: 'draft' | 'approved' | 'rejected'
  approvedBy: number | null
  approvedAt: string | null
  createdAt: string
}

export interface DimensionScore {
  dimension: string
  score: number
  level: 'low' | 'medium' | 'high'
  maxScore: number
}

export interface QuestionnaireQuestion {
  id: string
  text: string
  dimension: string
  type: 'flash' | 'full'
}

export interface AuthSession {
  token: string
  consultant: Consultant
  expiresAt: string
}

