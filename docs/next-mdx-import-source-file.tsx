// Shim module for Turbopack compatibility with Nextra
// Turbopack cannot resolve the virtual 'next-mdx-import-source-file' module that Nextra expects
// This file provides the useMDXComponents export that Nextra needs

export { useMDXComponents } from './mdx-components'
