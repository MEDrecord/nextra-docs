import { getPageMap } from 'nextra/page-map'
import type { PageMapItem } from 'nextra'

// Routes to hide from all navigation sidebars
const HIDDEN_ROUTES = ['admin', 'auth']

function filterHiddenRoutes(items: PageMapItem[]): PageMapItem[] {
  return items
    .filter(item => {
      if ('name' in item && HIDDEN_ROUTES.includes(item.name)) {
        return false
      }
      return true
    })
    .map(item => {
      // Recursively filter children
      if ('children' in item && Array.isArray(item.children)) {
        return {
          ...item,
          children: filterHiddenRoutes(item.children)
        }
      }
      return item
    })
}

export const getEnhancedPageMap: typeof getPageMap = async (...args) => {
  const pageMap = await getPageMap(...args)
  return filterHiddenRoutes(pageMap)
}
