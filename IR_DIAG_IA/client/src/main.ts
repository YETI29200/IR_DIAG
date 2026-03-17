import { createApp } from 'vue'
import App from './App.vue'
import routerModule, { router } from './router'
import { routes } from './router/routes'
import './styles/tailwind.css'
import './styles/main.scss'

// Get router instance (from named export or default export)
const routerInstance = router || routerModule.router || routerModule

// Register routes
routes.forEach(route => {
  routerInstance.addRoute(route)
})

// Ensure router is initialized with current path on page load/refresh
if (typeof window !== 'undefined') {
  // Sync router with current URL on initialization
  const currentPath = window.location.pathname
  if (currentPath !== routerInstance.getCurrentPath().value) {
    routerInstance.replace(currentPath)
  }
}

const app = createApp(App)
app.use(routerModule) // Use the module for Vue plugin
app.mount('#app')

