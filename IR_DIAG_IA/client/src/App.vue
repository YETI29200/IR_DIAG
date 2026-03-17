<template>
  <div id="app">
    <HeaderKepler v-if="showLayout" />
    <RouterView />
    <FooterKepler v-if="showLayout" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { router } from './router'
import RouterView from './components/RouterView.vue'
import HeaderKepler from './components/HeaderKepler.vue'
import FooterKepler from './components/FooterKepler.vue'

const currentPath = router.getCurrentPath()

const showLayout = computed(() => {
  const path = currentPath.value
  // Hide header/footer for report pages
  return !path.startsWith('/report/') && path !== '/print-report'
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex-grow: 1;
}
</style>
