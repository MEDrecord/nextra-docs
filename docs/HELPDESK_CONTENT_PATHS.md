# HealthTalk Documentation - Content Paths for Helpdesk Integration

**Base URL (Production):** `https://docs.healthtalk.ai`  
**Base URL (Test):** `https://docs-tst.healthtalk.ai`

---

## API Endpoints

### Fetch Single Page
```
GET /api/content?path={path}
```

### List All Pages in Section
```
GET /api/content?action=list&section={section}
```

---

## Available Documentation Paths

### Help Center
| Path | Description |
|------|-------------|
| `/help/overview` | Help Center Overview |
| `/help/faq` | Frequently Asked Questions |
| `/help/account` | Account Management |
| `/help/how-to-guides` | How-To Guides |
| `/help/troubleshooting` | Troubleshooting |

**Example:** `GET /api/content?path=/help/faq`

---

### Getting Started
| Path | Description |
|------|-------------|
| `/docs` | Documentation Home |
| `/docs/getting-started/introduction` | Introduction |
| `/docs/getting-started/installation` | Installation Guide |
| `/docs/getting-started/quick-start` | Quick Start Guide |
| `/docs/getting-started/configuration` | Configuration |

**Example:** `GET /api/content?path=/docs/getting-started/quick-start`

---

### Products
| Path | Description |
|------|-------------|
| `/docs/products/overview` | Products Overview |
| `/docs/products/healthtalk` | HealthTalk Platform |
| `/docs/products/helpdesk` | Helpdesk Product |
| `/docs/products/gateway` | API Gateway |
| `/docs/products/ehr-platform` | EHR Platform |
| `/docs/products/agents` | AI Agents |
| `/docs/products/project-management` | Project Management |
| `/docs/products/research-ops` | Research Operations |

**Example:** `GET /api/content?path=/docs/products/helpdesk`

---

### User Guide
| Path | Description |
|------|-------------|
| `/docs/user-guide/overview` | User Guide Overview |
| `/docs/user-guide/patient-communication` | Patient Communication |
| `/docs/user-guide/scheduling` | Scheduling |
| `/docs/user-guide/notifications` | Notifications |
| `/docs/user-guide/message-templates` | Message Templates |
| `/docs/user-guide/analytics` | Analytics |

**Example:** `GET /api/content?path=/docs/user-guide/scheduling`

---

### Developer Documentation
| Path | Description |
|------|-------------|
| `/developer` | Developer Home |
| `/developer/developer-tools/overview` | Developer Tools Overview |
| `/developer/developer-tools/platform-stack` | Platform Stack |
| `/developer/developer-tools/ai-assistance` | AI Assistance |
| `/developer/developer-tools/custom-commands` | Custom Commands |
| `/developer/developer-tools/project-rules` | Project Rules |
| `/developer/developer-tools/workflows` | Workflows |

**Example:** `GET /api/content?path=/developer/developer-tools/overview`

---

### Knowledge Base
| Path | Description |
|------|-------------|
| `/knowledge` | Knowledge Base Home |
| `/knowledge/overview` | Overview |
| `/knowledge/patterns` | Design Patterns |
| `/knowledge/code-reviews` | Code Reviews |
| `/knowledge/test-templates` | Test Templates |
| `/knowledge/prevention` | Prevention Guidelines |

**Example:** `GET /api/content?path=/knowledge/patterns`

---

### ISMS (Information Security Management System)

#### Main Pages
| Path | Description |
|------|-------------|
| `/isms` | ISMS Home |
| `/isms/awareness` | Security Awareness |
| `/isms/checklist` | Security Checklist |
| `/isms/audit` | Audit Information |
| `/isms/report-incident` | Report an Incident |

#### Policies
| Path | Description |
|------|-------------|
| `/isms/policies` | All Policies |
| `/isms/policies/information-security` | Information Security Policy |
| `/isms/policies/acceptable-use` | Acceptable Use Policy |
| `/isms/policies/access-control` | Access Control Policy |
| `/isms/policies/password` | Password Policy |
| `/isms/policies/mobile-device` | Mobile Device Policy |
| `/isms/policies/remote-working` | Remote Working Policy |
| `/isms/policies/backup` | Backup Policy |
| `/isms/policies/cryptography` | Cryptography Policy |
| `/isms/policies/incident-management` | Incident Management Policy |
| `/isms/policies/information-classification` | Information Classification Policy |
| `/isms/policies/information-retention` | Information Retention Policy |
| `/isms/policies/privacy` | Privacy Policy |
| `/isms/policies/code-of-conduct` | Code of Conduct |
| `/isms/policies/secure-development` | Secure Development Policy |
| `/isms/policies/supplier-relationship` | Supplier Relationship Policy |

**Example:** `GET /api/content?path=/isms/policies/password`

#### Procedures
| Path | Description |
|------|-------------|
| `/isms/procedures` | All Procedures |
| `/isms/procedures/access-management` | Access Management Procedure |
| `/isms/procedures/backup-restore` | Backup & Restore Procedure |
| `/isms/procedures/change-management` | Change Management Procedure |
| `/isms/procedures/incident-response` | Incident Response Procedure |
| `/isms/procedures/onboarding-offboarding` | Onboarding/Offboarding Procedure |

**Example:** `GET /api/content?path=/isms/procedures/incident-response`

#### Registers
| Path | Description |
|------|-------------|
| `/isms/registers` | All Registers |
| `/isms/registers/risk-assessment` | Risk Assessment Register |
| `/isms/registers/incidents` | Incidents Register |
| `/isms/registers/changes` | Changes Register |
| `/isms/registers/suppliers` | Suppliers Register |
| `/isms/registers/legal-requirements` | Legal Requirements Register |

**Example:** `GET /api/content?path=/isms/registers/risk-assessment`

#### Annex A Controls
| Path | Description |
|------|-------------|
| `/isms/annex-a` | Annex A Overview |
| `/isms/annex-a/a-6-1-2-segregation-duties` | A.6.1.2 Segregation of Duties |
| `/isms/annex-a/a-7-2-2-security-awareness` | A.7.2.2 Security Awareness |
| `/isms/annex-a/a-9-4-2-secure-logon` | A.9.4.2 Secure Log-on |
| `/isms/annex-a/a-12-6-1-technical-vulnerabilities` | A.12.6.1 Technical Vulnerabilities |
| `/isms/annex-a/a-16-1-1-responsibilities-procedures` | A.16.1.1 Responsibilities & Procedures |
| `/isms/annex-a/a-16-1-2-reporting-security-events` | A.16.1.2 Reporting Security Events |
| `/isms/annex-a/a-16-1-3-reporting-weaknesses` | A.16.1.3 Reporting Weaknesses |
| `/isms/annex-a/a-16-1-7-collection-evidence` | A.16.1.7 Collection of Evidence |

**Example:** `GET /api/content?path=/isms/annex-a/a-16-1-2-reporting-security-events`

#### Risks
| Path | Description |
|------|-------------|
| `/isms/risks` | Risk Overview |
| `/isms/risks/2019-04-social-engineering` | Social Engineering Risk |

**Example:** `GET /api/content?path=/isms/risks`

---

## List Endpoints by Section

| Section | Endpoint |
|---------|----------|
| All docs | `GET /api/content?action=list` |
| Help | `GET /api/content?action=list&section=help` |
| Docs | `GET /api/content?action=list&section=docs` |
| Developer | `GET /api/content?action=list&section=developer` |
| Knowledge | `GET /api/content?action=list&section=knowledge` |
| ISMS | `GET /api/content?action=list&section=isms` |
| ISMS Policies | `GET /api/content?action=list&section=isms/policies` |
| ISMS Procedures | `GET /api/content?action=list&section=isms/procedures` |

---

## Response Format

### Single Page Response
```json
{
  "success": true,
  "path": "/help/faq",
  "title": "Frequently Asked Questions",
  "content": "<article class=\"prose\">...HTML content...</article>",
  "lastModified": "2026-03-12T10:00:00.000Z"
}
```

### List Response
```json
{
  "success": true,
  "items": [
    { "path": "/isms/policies/password", "title": "Password Policy" },
    { "path": "/isms/policies/access-control", "title": "Access Control Policy" }
  ],
  "section": "isms/policies"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Page not found",
  "path": "/invalid/path"
}
```

---

## Quick Copy URLs (Test Environment)

### Help Center
- https://docs-tst.healthtalk.ai/api/content?path=/help/faq
- https://docs-tst.healthtalk.ai/api/content?path=/help/troubleshooting
- https://docs-tst.healthtalk.ai/api/content?path=/help/how-to-guides

### Products
- https://docs-tst.healthtalk.ai/api/content?path=/docs/products/helpdesk
- https://docs-tst.healthtalk.ai/api/content?path=/docs/products/gateway

### ISMS
- https://docs-tst.healthtalk.ai/api/content?path=/isms/policies/password
- https://docs-tst.healthtalk.ai/api/content?path=/isms/procedures/incident-response
- https://docs-tst.healthtalk.ai/api/content?action=list&section=isms/policies

---

## Notes

1. **Authentication**: Requests from `*.healthtalk.ai` share the same `auth.sid` cookie - no additional auth needed
2. **CORS**: Only `*.healthtalk.ai` origins and `localhost` are allowed
3. **Caching**: Responses include `Cache-Control` headers for client-side caching
4. **Credentials**: Always use `credentials: 'include'` in fetch requests
