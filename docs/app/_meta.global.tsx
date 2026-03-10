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

export default {
  index: {
    type: 'page',
    display: 'hidden'
  },
  docs: {
    type: 'page',
    title: 'Documentation',
    items: {
      index: 'Welcome',
      'getting-started': { 
        title: 'Getting Started',
        items: GETTING_STARTED 
      },
      'user-guide': { 
        title: 'User Guide',
        items: USER_GUIDE 
      },
      _: {
        type: 'separator',
        title: 'Developer'
      },
      'api-reference': { 
        title: 'API Reference',
        items: API_REFERENCE 
      },
      'architecture': { 
        title: 'Architecture',
        items: ARCHITECTURE 
      },
      __: {
        type: 'separator',
        title: 'Compliance & Security'
      },
      'compliance': { 
        title: 'Compliance',
        items: COMPLIANCE 
      },
      'isms': { 
        title: 'ISMS',
        items: ISMS 
      }
    }
  }
}
