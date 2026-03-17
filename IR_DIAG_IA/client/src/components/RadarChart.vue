<template>
  <div class="radar-chart">
    <svg :width="size" :height="size" viewBox="0 0 500 500">
      <!-- Background circles (dotted lines like reference) -->
      <circle
        v-for="level in 5"
        :key="level"
        :cx="centerX"
        :cy="centerY"
        :r="(level * radius) / 5"
        fill="none"
        stroke="#e5e7eb"
        stroke-width="1"
        stroke-dasharray="2,2"
      />

      <!-- Axes (lines from center to each dimension) -->
      <line
        v-for="(dimension, index) in dimensions"
        :key="dimension"
        :x1="centerX"
        :y1="centerY"
        :x2="getAxisEndX(index)"
        :y2="getAxisEndY(index)"
        stroke="#9ca3af"
        stroke-width="1"
      />

      <!-- Score polygon with gradient (like reference: dark purple center to light pink edges) -->
      <defs v-if="scorePoints.length >= 3 && polygonPoints">
        <linearGradient :id="gradientId" x1="50%" y1="50%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(147, 51, 234, 0.5)" stop-opacity="1" />
          <stop offset="50%" stop-color="rgba(147, 51, 234, 0.35)" stop-opacity="1" />
          <stop offset="100%" stop-color="rgba(236, 72, 153, 0.25)" stop-opacity="1" />
        </linearGradient>
      </defs>
      <polygon
        v-if="scorePoints.length >= 3 && polygonPoints"
        :points="polygonPoints"
        :fill="`url(#${gradientId})`"
        stroke="#9333ea"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
        opacity="1"
      />

      <!-- Dimension labels with background for readability -->
      <g
        v-for="(dimension, index) in dimensions"
        :key="dimension"
        class="label-group"
      >
        <!-- Background rectangle for text (calculated based on text length) -->
        <rect
          :x="getLabelX(index) - getLabelWidth(index) / 2"
          :y="getLabelY(index) - 14"
          :width="getLabelWidth(index)"
          height="28"
          fill="white"
          fill-opacity="0.98"
          stroke="#d1d5db"
          stroke-width="1.5"
          rx="8"
        />
        <!-- Label text -->
        <text
          :x="getLabelX(index)"
          :y="getLabelY(index)"
          text-anchor="middle"
          dominant-baseline="middle"
          class="dimension-label"
        >
          {{ formatDimension(dimension) }}
        </text>
      </g>

      <!-- Score points -->
      <circle
        v-for="(point, index) in scorePoints"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        r="5"
        fill="#2563eb"
        stroke="white"
        stroke-width="1.5"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DimensionScore } from '@shared/types'

interface Props {
  scores: DimensionScore[]
}

const props = defineProps<Props>()

const size = 500
const centerX = size / 2
const centerY = size / 2
const radius = 130
const padding = 80

// Extract dimensions from scores
const dimensions = computed(() => props.scores.map(s => s.dimension))

// Generate unique gradient ID (computed once)
const gradientId = `radarGradient-${Math.random().toString(36).substr(2, 9)}`

// Calculate angle for each dimension (distributed evenly around circle)
function getAngle(index: number): number {
  const totalDimensions = dimensions.value.length
  return (index * 2 * Math.PI) / totalDimensions - Math.PI / 2 // Start at top
}

// Get axis end coordinates
function getAxisEndX(index: number): number {
  const angle = getAngle(index)
  return centerX + radius * Math.cos(angle)
}

function getAxisEndY(index: number): number {
  const angle = getAngle(index)
  return centerY + radius * Math.sin(angle)
}

// Get label coordinates (slightly outside the circle)
function getLabelX(index: number): number {
  const angle = getAngle(index)
  return centerX + (radius + padding) * Math.cos(angle)
}

function getLabelY(index: number): number {
  const angle = getAngle(index)
  return centerY + (radius + padding) * Math.sin(angle)
}

// Calculate label width based on text length
function getLabelWidth(index: number): number {
  const dimension = dimensions.value[index]
  const text = formatDimension(dimension)
  // More generous calculation for longer words like "Organisation", "Technologie", "Mise en œuvre"
  const charCount = text.length
  const hasAccents = /[àâäéèêëïîôùûüÿç]/.test(text)
  const hasSpaces = text.includes(' ')
  
  // Base width calculation: more space for accented chars and spaces
  let baseWidth = charCount * (hasAccents ? 10 : 9)
  if (hasSpaces) {
    baseWidth += 15 // Extra space for multi-word labels
  }
  
  // Special handling for known long labels
  const longLabels: Record<string, number> = {
    'Organisation': 120,
    'Technologie': 110,
    'Mise en œuvre': 130,
    'Cas d\'usage': 110,
    'Écosystème': 110
  }
  
  if (longLabels[text]) {
    return longLabels[text]
  }
  
  return Math.max(80, baseWidth + 40) // Minimum 80px, add 40px padding
}

// Calculate score points (normalized to 0-1, then scaled to radius)
const scorePoints = computed(() => {
  return props.scores.map((score, index) => {
    const normalizedScore = score.score / 100 // 0-1
    const distance = normalizedScore * radius
    const angle = getAngle(index)
    
    return {
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle)
    }
  })
})

// Generate polygon points string (SVG polygon automatically closes)
const polygonPoints = computed(() => {
  if (scorePoints.value.length < 3) return ''
  return scorePoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

function formatDimension(dimension: string): string {
  // Use dimensionTitle from score if available
  const score = props.scores.find(s => s.dimension === dimension)
  if (score && (score as any).dimensionTitle) {
    return (score as any).dimensionTitle
  }
  
  const map: Record<string, string> = {
    ambition: 'Ambition',
    pilotage: 'Pilotage',
    organisation: 'Organisation',
    organization: 'Organisation',
    culture: 'Culture',
    donnees: 'Données',
    cas_usage: 'Cas d\'usage',
    ecosysteme: 'Écosystème',
    expertise: 'Expertise',
    technologie: 'Technologie',
    technology: 'Technologie',
    mise_en_oeuvre: 'Mise en œuvre',
    strategy: 'Stratégie',
    governance: 'Gouvernance',
    skills: 'Compétences',
    usage: 'Usage',
    measurement: 'Mesure',
    data: 'Données',
    ethics: 'Éthique',
    innovation: 'Innovation'
  }
  return map[dimension] || dimension
}
</script>

<style scoped>
.radar-chart {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  overflow: visible;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

svg {
  background: white;
  border-radius: 12px;
  overflow: visible;
}

.label-group .dimension-label {
  font-size: 14px;
  fill: #111827; /* gray-900 */
  font-weight: 600;
  pointer-events: none;
}
</style>

