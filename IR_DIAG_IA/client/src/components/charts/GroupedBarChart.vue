<template>
  <div class="grouped-bar-chart">
    <div class="chart-wrapper">
      <!-- Y Axis -->
      <div class="y-axis">
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
        <span>0%</span>
      </div>
      
      <!-- Chart Groups -->
      <div class="groups-container">
        <!-- Grid Lines -->
        <div class="grid-lines">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>
        
        <div v-for="group in groups" :key="group.id" class="group-column">
          <div class="bars-container">
            <div 
              v-for="(val, idx) in group.values" 
              :key="idx" 
              class="bar"
              :class="{ 'is-zero': val === 0 }"
              :style="{ 
                height: `${val}%`, 
                backgroundColor: series[idx].color,
                zIndex: 10
              }"
            >
              <!-- Tooltip -->
              <div class="tooltip">
                <strong>{{ series[idx].label }}</strong>
                <span>{{ val }}%</span>
              </div>
              <span class="bar-value" v-if="val > 15">{{ val }}</span>
            </div>
          </div>
          <div class="group-label">
            <slot name="label" :group="group">
              <span class="label-text">{{ group.label }}</span>
            </slot>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Legend -->
    <div class="legend">
      <div v-for="(s, i) in series" :key="i" class="legend-item">
        <span class="color-dot" :style="{ backgroundColor: s.color }"></span>
        <span class="legend-text">{{ s.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">


interface Group {
  id: string | number
  label: string
  values: number[]
  [key: string]: any
}

interface Series {
  label: string
  color: string
}

const props = defineProps<{
  groups: Group[]
  series: Series[]
}>()
</script>

<style scoped>
.grouped-bar-chart {
  width: 100%;
  padding: 1rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.chart-wrapper {
  display: flex;
  height: 350px;
  margin-bottom: 2rem;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 1rem;
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 500;
  padding-bottom: 2rem;
}

.groups-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding-left: 0.5rem;
  padding-bottom: 2rem;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  z-index: 0;
}

.grid-lines .line {
  width: 100%;
  height: 1px;
  background-color: #f3f4f6;
  border-bottom: 1px dashed #e5e7eb;
}

.grid-lines .line:last-child {
  border-bottom: 1px solid #d1d5db;
}

.group-column {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
  max-width: 150px;
  margin: 0 0.5rem;
}

.group-column .group-label {
  position: absolute;
  top: 100%;
  margin-top: 12px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.bars-container {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 100%;
  width: 100%;
}

.bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar:hover {
  filter: brightness(0.95);
  z-index: 20 !important;
}

.bar:hover .tooltip {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -10px);
}

.bar.is-zero {
  height: 2px !important;
  background-color: #e5e7eb !important;
}

.bar-value {
  color: white;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  padding: 2px 4px;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, 0);
  background: #1f2937;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1f2937;
}

.tooltip strong {
  display: block;
  margin-bottom: 2px;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 3rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.legend-item .color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.legend-item .legend-text {
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}
</style>
