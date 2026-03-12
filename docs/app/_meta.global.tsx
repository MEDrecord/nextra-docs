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

const ISMS: MetaRecord = {
  index: 'Overview',
  // PUBLIC - All authenticated employees
  'awareness': 'Security Awareness',
  'report-incident': 'Report Incident',
  'policies': 'Policies',
  'procedures': 'Procedures',
  // RESTRICTED - Management & Security Officer only
  'checklist': 'Implementation Checklist',
  'annex-a': 'Annex A Controls',
  'registers': 'Registers',
  'risks': 'Risk Register',
  'audit': 'Audit & Evidence',
  'access-denied': {
    display: 'hidden'
  }
}

const ISMS_POLICIES: MetaRecord = {
  index: 'Overview',
  'password': 'Password Policy',
  'remote-working': 'Remote Working Policy',
  'mobile-device': 'Mobile Device Policy',
  'acceptable-use': 'Acceptable Use Policy',
  'information-classification': 'Information Classification',
  'privacy': 'Privacy Policy',
  'access-control': 'Access Control Policy',
  'secure-development': 'Secure Development Policy',
  'cryptography': 'Cryptography Policy',
  'backup': 'Backup Policy',
  'supplier-relationship': 'Supplier Relationship Policy',
  'incident-management': 'Incident Management Policy',
  'information-security': 'Information Security Policy',
  'code-of-conduct': 'Code of Conduct',
  'information-retention': 'Information Retention Policy'
}

const ISMS_PROCEDURES: MetaRecord = {
  index: 'Overview',
  'access-management': 'Access Management',
  'incident-response': 'Incident Response',
  'change-management': 'Change Management',
  'backup-restore': 'Backup & Restore',
  'onboarding-offboarding': 'Onboarding & Offboarding'
}

const ISMS_ANNEX_A: MetaRecord = {
  index: 'Overview',
  'a-6-1-2-segregation-duties': 'A.6.1.2 Segregation of duties',
  'a-7-2-2-security-awareness': 'A.7.2.2 Security awareness',
  'a-9-4-2-secure-logon': 'A.9.4.2 Secure log-on',
  'a-12-6-1-technical-vulnerabilities': 'A.12.6.1 Technical vulnerabilities',
  'a-16-1-1-responsibilities-procedures': 'A.16.1.1 Responsibilities',
  'a-16-1-2-reporting-security-events': 'A.16.1.2 Reporting events',
  'a-16-1-3-reporting-weaknesses': 'A.16.1.3 Reporting weaknesses',
  'a-16-1-7-collection-evidence': 'A.16.1.7 Collection of evidence'
}

const ISMS_REGISTERS: MetaRecord = {
  index: 'Overview',
  'changes': 'Changes',
  'risk-assessment': 'Risk Assessment',
  'incidents': 'Incidents',
  'legal-requirements': 'Legal Requirements',
  'suppliers': 'Suppliers'
}

const DEVELOPER_TOOLS: MetaRecord = {
  overview: 'Overview',
  'platform-stack': 'Platform Stack',
  'ai-assistance': 'AI Assistance',
  'project-rules': 'Project Rules',
  'custom-commands': 'Custom Commands',
  'workflows': 'Workflows'
}

const PRODUCTS: MetaRecord = {
  overview: {
    display: 'hidden'
  },
  'healthtalk': 'HealthTalk',
  'helpdesk': 'Helpdesk',
'consortia-ai': 'ConsortiaAI',
        'gateway': 'Gateway',
  'agents': 'AI Agents',
  'ehr-platform': 'EHR Platform'
}

const KNOWLEDGE_BASE: MetaRecord = {
  overview: 'Overview',
  'patterns': 'Patterns',
  'test-templates': 'Test Templates',
  'prevention': 'Prevention Steps',
  'code-reviews': 'Code Reviews'
}

const HELP_CENTER: MetaRecord = {
  overview: 'Overview',
  'faq': 'FAQ',
  'how-to-guides': 'How-to Guides',
  'troubleshooting': 'Troubleshooting',
  'account': 'Account & Settings'
}

// Global theme settings to disable breadcrumb and toc across all pages
const themeConfig = {
  breadcrumb: false,
  toc: false
}

export default {
  '*': {
    theme: themeConfig
  },
  index: {
    type: 'page',
    display: 'hidden'
  },
  // Hide utility routes from navigation
  admin: {
    type: 'page',
    display: 'hidden'
  },
  auth: {
    type: 'page',
    display: 'hidden'
  },
  docs: {
    type: 'page',
    title: 'Products',
    items: {
      index: {
        display: 'hidden'
      },
      'getting-started': {
        display: 'hidden'
      },
      'user-guide': {
        display: 'hidden'
      },
      'products': {
        title: 'Products',
        items: {
          overview: {
            display: 'hidden'
          },
          'healthtalk': 'HealthTalk',
          'helpdesk': 'Helpdesk',
          'consortia-ai': 'ConsortiaAI',
          'gateway': 'Gateway',
          'agents': 'AI Agents',
          'ehr-platform': 'EHR Platform'
        }
      }
    }
  },
  isms: {
    type: 'page',
    title: 'ISMS',
    items: {
      index: 'Overview',
      // PUBLIC - All authenticated employees
      'awareness': 'Security Awareness',
      'report-incident': 'Report Incident',
      'policies': {
        title: 'Policies',
        items: ISMS_POLICIES
      },
      'procedures': {
        title: 'Procedures',
        items: ISMS_PROCEDURES
      },
      // RESTRICTED - Management & Security Officer only
      'checklist': 'Implementation Checklist',
      'annex-a': {
        title: 'Annex A Controls',
        items: ISMS_ANNEX_A
      },
      'registers': {
        title: 'Registers',
        items: ISMS_REGISTERS
      },
      'risks': 'Risk Register',
      'audit': 'Audit & Evidence',
      'access-denied': {
        display: 'hidden'
      }
    }
  },
  help: {
    type: 'page',
    title: 'Help Center',
    items: HELP_CENTER
  },
  knowledge: {
    type: 'page',
    title: 'Knowledge Base',
    items: KNOWLEDGE_BASE
  },
  developer: {
    type: 'page',
    title: 'Developer Tools',
    items: {
      index: 'Overview',
      'developer-tools': {
        title: 'Tools',
        items: DEVELOPER_TOOLS
      }
    }
  }
}
