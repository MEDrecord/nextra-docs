// Shim module for Turbopack compatibility with Nextra
// This file re-exports useMDXComponents from mdx-components.tsx
// Turbopack cannot resolve the virtual 'next-mdx-import-source-file' module that Nextra expects

export { useMDXComponents } from './mdx-components'
