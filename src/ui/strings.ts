export const strings = {
  appTitle: 'Agent-Readiness Checker',
  scopeLegend: 'Audit scope',
  scopeSelection: 'Selection',
  scopePages: 'Page(s)',
  scopeFile: 'Whole file',
  pagesLegend: 'Pages to include',
  runScan: 'Run scan',
  cancelScan: 'Cancel',
  close: 'Close',
  tabOverview: 'Overview',
  tabIssues: 'Issues',
  tabFileContext: 'File context',
  scanning: 'Scanning…',
  preScanHelp:
    'Choose what to audit, then run a scan. The plugin stays offline and only changes the file when you confirm a Fix.',
  resultsHeading: 'Scan results',
  overviewPlaceholder: 'Overview will show score, pass/issue counts, and category breakdown.',
  issuesPlaceholder: 'Issues will list prioritized findings with why / impact / how to fix.',
  fileContextPlaceholder:
    'File context will show inventory and scan metadata for what was audited.'
} as const
