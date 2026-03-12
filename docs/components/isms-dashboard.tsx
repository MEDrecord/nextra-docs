'use client'

// Simple SVG icons
const ShieldIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const AlertTriangleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const FileTextIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ClockIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UsersIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const ExternalLinkIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

// Control Status Summary Card
interface ControlStatusProps {
  implemented: number
  partial: number
  notImplemented: number
  notApplicable: number
}

export function ControlStatusCard({ implemented, partial, notImplemented, notApplicable }: ControlStatusProps) {
  const total = implemented + partial + notImplemented + notApplicable
  const complianceRate = Math.round((implemented / (total - notApplicable)) * 100)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <ShieldIcon className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Annex A Controls</h3>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{complianceRate}%</div>
        <div className="text-sm text-gray-500">Compliance Rate</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Implemented</span>
          </div>
          <span className="font-medium">{implemented}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span>Partial</span>
          </div>
          <span className="font-medium">{partial}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Not Implemented</span>
          </div>
          <span className="font-medium">{notImplemented}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-400" />
            <span>Not Applicable</span>
          </div>
          <span className="font-medium">{notApplicable}</span>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className="h-full flex">
          <div className="bg-green-500" style={{ width: `${(implemented / total) * 100}%` }} />
          <div className="bg-yellow-500" style={{ width: `${(partial / total) * 100}%` }} />
          <div className="bg-red-500" style={{ width: `${(notImplemented / total) * 100}%` }} />
          <div className="bg-gray-400" style={{ width: `${(notApplicable / total) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

// Risk Heatmap Component
interface Risk {
  id: string
  title: string
  likelihood: 'L' | 'M' | 'H'
  impact: 'L' | 'M' | 'H'
  treatment: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID'
}

interface RiskHeatmapProps {
  risks: Risk[]
}

const LIKELIHOOD_MAP = { 'L': 0, 'M': 1, 'H': 2 }
const IMPACT_MAP = { 'L': 0, 'M': 1, 'H': 2 }

const EXPOSURE_COLORS = [
  ['bg-green-100 dark:bg-green-900/30', 'bg-yellow-100 dark:bg-yellow-900/30', 'bg-orange-100 dark:bg-orange-900/30'],
  ['bg-yellow-100 dark:bg-yellow-900/30', 'bg-orange-100 dark:bg-orange-900/30', 'bg-red-100 dark:bg-red-900/30'],
  ['bg-orange-100 dark:bg-orange-900/30', 'bg-red-100 dark:bg-red-900/30', 'bg-red-200 dark:bg-red-900/50'],
]

export function RiskHeatmap({ risks }: RiskHeatmapProps) {
  const riskMatrix: Risk[][][] = [
    [[], [], []],
    [[], [], []],
    [[], [], []],
  ]

  risks.forEach(risk => {
    const l = LIKELIHOOD_MAP[risk.likelihood]
    const i = IMPACT_MAP[risk.impact]
    if (l !== undefined && i !== undefined && riskMatrix[l]?.[i]) {
      riskMatrix[l][i].push(risk)
    }
  })

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangleIcon className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Risk Heatmap</h3>
      </div>

      <div className="mb-2 text-sm text-gray-500 text-center">Impact</div>
      
      <div className="flex">
        <div className="flex flex-col justify-around text-sm text-gray-500 pr-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          Likelihood
        </div>
        
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-1 mb-1">
            <div className="text-center text-xs text-gray-500">Low</div>
            <div className="text-center text-xs text-gray-500">Medium</div>
            <div className="text-center text-xs text-gray-500">High</div>
          </div>
          
          {['H', 'M', 'L'].map((likelihood, li) => (
            <div key={likelihood} className="grid grid-cols-3 gap-1 mb-1">
              {['L', 'M', 'H'].map((impact, ii) => {
                const actualLi = 2 - li
                const cellRisks = riskMatrix[actualLi][ii]
                return (
                  <div
                    key={`${likelihood}-${impact}`}
                    className={`${EXPOSURE_COLORS[actualLi][ii]} rounded p-2 min-h-[60px] flex flex-col items-center justify-center`}
                  >
                    {cellRisks.length > 0 && (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {cellRisks.length}
                      </span>
                    )}
                  </div>
                )
              })}
              <div className="text-xs text-gray-500 flex items-center pl-2">
                {likelihood === 'H' ? 'High' : likelihood === 'M' ? 'Medium' : 'Low'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium mb-2">Total Risks: {risks.length}</div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Accept: {risks.filter(r => r.treatment === 'ACCEPT').length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Mitigate: {risks.filter(r => r.treatment === 'MITIGATE').length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Transfer: {risks.filter(r => r.treatment === 'TRANSFER').length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick Stats Card
interface QuickStatsProps {
  policies: number
  controls: number
  risks: number
  openIncidents: number
}

export function QuickStats({ policies, controls, risks, openIncidents }: QuickStatsProps) {
  const stats = [
    { label: 'Policies', value: policies, Icon: FileTextIcon, color: 'text-blue-600' },
    { label: 'Controls', value: controls, Icon: ShieldIcon, color: 'text-green-600' },
    { label: 'Risks', value: risks, Icon: AlertTriangleIcon, color: 'text-orange-600' },
    { label: 'Open Incidents', value: openIncidents, Icon: ClockIcon, color: 'text-red-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, Icon, color }) => (
        <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-sm text-gray-500">{label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
      ))}
    </div>
  )
}

// Audit Quick Links
interface AuditLink {
  title: string
  description: string
  href: string
  external?: boolean
}

interface AuditLinksProps {
  links: AuditLink[]
}

export function AuditLinks({ links }: AuditLinksProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <UsersIcon className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Audit Resources</h3>
      </div>

      <div className="space-y-3">
        {links.map((link) => (
          <a
            key={link.title}
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{link.title}</div>
              <div className="text-sm text-gray-500">{link.description}</div>
            </div>
            {link.external && <ExternalLinkIcon className="h-4 w-4 text-gray-400" />}
          </a>
        ))}
      </div>
    </div>
  )
}

// Control Status Badge
interface ControlStatusBadgeProps {
  status: 'implemented' | 'partial' | 'not-implemented' | 'not-applicable'
}

const CONTROL_STATUS_CONFIG = {
  'implemented': { label: 'Implemented', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'partial': { label: 'Partial', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'not-implemented': { label: 'Not Implemented', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  'not-applicable': { label: 'N/A', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
}

export function ControlStatusBadge({ status }: ControlStatusBadgeProps) {
  const config = CONTROL_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

// Risk Treatment Badge
interface RiskTreatmentBadgeProps {
  treatment: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID'
}

const TREATMENT_CONFIG = {
  'ACCEPT': { label: 'Accept', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'MITIGATE': { label: 'Mitigate', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  'TRANSFER': { label: 'Transfer', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  'AVOID': { label: 'Avoid', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export function RiskTreatmentBadge({ treatment }: RiskTreatmentBadgeProps) {
  const config = TREATMENT_CONFIG[treatment]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

// Exposure Level Badge
interface ExposureBadgeProps {
  level: 'L' | 'M' | 'H'
}

const EXPOSURE_CONFIG = {
  'L': { label: 'Low', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'M': { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'H': { label: 'High', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export function ExposureBadge({ level }: ExposureBadgeProps) {
  const config = EXPOSURE_CONFIG[level]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
