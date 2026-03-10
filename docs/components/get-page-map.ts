import { getPageMap } from 'nextra/page-map'

export const getEnhancedPageMap: typeof getPageMap = async (...args) => {
  return getPageMap(...args)
}
