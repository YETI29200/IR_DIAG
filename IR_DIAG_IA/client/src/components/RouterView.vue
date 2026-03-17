<template>
  <component :is="currentComponent" v-bind="componentProps" />
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { router } from '../router'

const currentPath = router.getCurrentPath()
const currentRoute = computed(() => {
  void currentPath.value // Access to make reactive
  return router.getCurrentRoute()
})

const params = computed(() => router.getParams())
const query = computed(() => router.getQuery())

const currentComponent = computed(() => {
  const route = currentRoute.value
  if (!route) {
    // Return 404 component
    return {
      name: 'NotFound',
      setup() {
        return () => h('div', { 
          class: 'not-found', 
          style: 'padding: 2rem; text-align: center; background: white; min-height: 100vh; color: #333;' 
        }, [
          h('h1', '404 - Page not found'),
          h('p', { style: 'margin-top: 1rem;' }, `Route: ${currentPath.value}`),
          h('a', { 
            href: '/', 
            onClick: (e: MouseEvent) => { 
              e.preventDefault()
              router.push('/')
            },
            style: 'display: inline-block; margin-top: 1rem; color: #0066CC; text-decoration: none;' 
          }, 'Retour à l\'accueil')
        ])
      }
    }
  }
  return route.component
})

const componentProps = computed(() => ({
  params: params.value,
  query: query.value
}))
</script>

