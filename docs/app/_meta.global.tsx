import type { MetaRecord } from 'nextra'

const GETTING_STARTED: MetaRecord = {
  introduction: 'Introduction',
  installation: 'Installation',
  configuration: 'Configuration',
  'quick-start': 'Quick Start'
}

const USER_GUIDE: MetaRecord = {
  overview: 'Overview',
  'patient-communication': 'Patient Communication',
  'message-templates': 'Message Templates',
  'scheduling': 'Scheduling',
  'notifications': 'Notifications',
  'analytics': 'Analytics'
}

const API_REFERENCE: MetaRecord = {
  overview: 'Overview',
  authentication: 'Authentication',
  endpoints: 'Endpoints',
  webhooks: 'Webhooks',
  'error-handling': 'Error Handling',
  'rate-limits': 'Rate Limits'
}

const COMPLIANCE: MetaRecord = {
  overview: 'Overview',
  'iso-13485': 'ISO 13485',
  'iso-62304': 'ISO 62304',
  'nen-7510': 'NEN 7510',
  'gdpr': 'GDPR',
  'audit-trail': 'Audit Trail'
}

const ARCHITECTURE: MetaRecord = {
  overview: 'Overview',
  'system-design': 'System Design',
  'data-flow': 'Data Flow',
  'security': 'Security',
  'integrations': 'Integrations'
}

const ISMS: MetaRecord = {
  overview: 'Overview',
  'policies': 'Policies',
  'procedures': 'Procedures',
  'risk-management': 'Risk Management',
  'incident-response': 'Incident Response',
  'access-control': 'Access Control'
}

const DEVELOPER_TOOLS: MetaRecord = {
  overview: 'Overview',
  'ai-assistance': 'AI Assistance',
  'project-rules': 'Project Rules',
  'custom-commands': 'Custom Commands',
  'workflows': 'Workflows'
}

const PRODUCTS: MetaRecord = {
  overview: 'Overview',
  'healthtalk': 'HealthTalk',
  'helpdesk': 'Helpdesk',
  'gateway': 'Gateway',
  'agents': 'AI Agents',
  'ehr-platform': 'EHR Platform'
}

const KNOWLEDGE_BASE: MetaRecord = {
  overview: 'Overview',
  'faq': 'FAQ',
  'how-to-guides': 'How-to Guides',
  'troubleshooting': 'Troubleshooting',
  'best-practices': 'Best Practices'
}

export default {
  index: {
    type: 'page',
    display: 'hidden'
  },
  isms: {
    type: 'page',
    title: 'ISMS',
    items: ISMS
  },
  faq: {
    type: 'page',
    title: 'FAQ',
    items: KNOWLEDGE_BASE
  },
  developer: {
    type: 'page',
    title: 'Developer',
    items: {
      'api-reference': { 
        title: 'API Reference',
        items: API_REFERENCE 
      },
      'architecture': { 
        title: 'Architecture',
        items: ARCHITECTURE 
      },
      'developer-tools': {
        title: 'Developer Tools',
        items: DEVELOPER_TOOLS
      },
      'compliance': { 
        title: 'Compliance',
        items: COMPLIANCE 
      }
    }
  },
  products: {
    type: 'page',
    title: 'Products',
    items: PRODUCTS
  },
  'user-guide': {
    type: 'page',
    title: 'User Guide',
    items: {
      'getting-started': { 
        title: 'Getting Started',
        items: GETTING_STARTED 
      },
      ...USER_GUIDE
    }
  }
}
