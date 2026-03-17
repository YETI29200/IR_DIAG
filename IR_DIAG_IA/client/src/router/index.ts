// Minimal in-house router implementation
import { ref, reactive, h } from 'vue'
import type { Component } from 'vue'

interface Route {
  path: string
  component: Component
  meta?: { requiresAuth?: boolean }
}

class Router {
  private routes: Route[] = []
  private currentPath = ref(window.location.pathname)
  private currentQuery = reactive<Record<string, string>>({})

  constructor() {
    // Initialize with current path (pathname only, no query string)
    if (typeof window !== 'undefined') {
      this.currentPath.value = window.location.pathname
      this.parseQuery()
    }

    // Listen to browser navigation (back/forward buttons and refresh)
    window.addEventListener('popstate', () => {
      this.currentPath.value = window.location.pathname
      this.parseQuery()
    })

    // Also listen to hashchange for compatibility
    window.addEventListener('hashchange', () => {
      this.currentPath.value = window.location.pathname
      this.parseQuery()
    })
  }

  addRoute(route: Route) {
    this.routes.push(route)
  }

  push(path: string) {
    // Extract pathname from full path (remove query string for path matching)
    const url = new URL(path, window.location.origin)
    const pathname = url.pathname

    window.history.pushState({}, '', path)
    this.currentPath.value = pathname
    this.parseQuery()
  }

  replace(path: string) {
    // Extract pathname from full path (remove query string for path matching)
    const url = new URL(path, window.location.origin)
    const pathname = url.pathname

    window.history.replaceState({}, '', path)
    this.currentPath.value = pathname
    this.parseQuery()
  }

  private parseQuery() {
    const params = new URLSearchParams(window.location.search)
    Object.keys(this.currentQuery).forEach(key => delete this.currentQuery[key])
    params.forEach((value, key) => {
      this.currentQuery[key] = value
    })
  }

  getCurrentRoute() {
    return this.routes.find(r => {
      // Simple path matching (supports :id params)
      const routePattern = r.path.replace(/:\w+/g, '[^/]+')
      const regex = new RegExp(`^${routePattern}$`)
      return regex.test(this.currentPath.value)
    })
  }

  getParams(): Record<string, string> {
    const route = this.getCurrentRoute()
    if (!route) return {}

    const routeParts = route.path.split('/')
    const pathParts = this.currentPath.value.split('/')
    const params: Record<string, string> = {}

    routeParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1)
        params[paramName] = pathParts[index] || ''
      }
    })

    return params
  }

  getQuery() {
    return this.currentQuery
  }

  getCurrentPath() {
    return this.currentPath
  }
}

const router = new Router()

// RouterLink component
const RouterLink = {
  name: 'RouterLink',
  props: {
    to: {
      type: String,
      required: true
    }
  },
  setup(props: any, { slots, attrs }: any) {
    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      router.push(props.to)
    }

    return () => {
      return h(
        'a',
        {
          href: props.to,
          onClick: handleClick,
          class: attrs.class || 'router-link',
          ...attrs
        },
        slots.default?.()
      )
    }
  }
}

// Export router instance for direct access
export { router }

export default {
  install(app: any) {
    app.config.globalProperties.$router = router
    app.component('RouterLink', RouterLink)
    app.provide('router', router)
  },
  router, // Export router instance
  currentPath: router.getCurrentPath(),
  push: (path: string) => router.push(path),
  replace: (path: string) => router.replace(path),
  getCurrentRoute: () => router.getCurrentRoute(),
  getParams: () => router.getParams(),
  getQuery: () => router.getQuery(),
  addRoute: (route: Route) => router.addRoute(route)
}

