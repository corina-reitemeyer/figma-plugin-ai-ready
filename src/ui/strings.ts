export const strings = {
  appTitle: 'Agent-Readiness Checker',
  scopeLegend: 'Scan scope',
  scopeSelection: 'Selection / frame / component',
  scopePages: 'Specific pages',
  scopeFile: 'Full file',
  pagesLegend: 'Pages to include',
  runScan: 'Scan',
  cancelScan: 'Cancel',
  close: 'Close',
  tabOverview: 'Overview',
  tabIssues: 'Issues',
  tabFileContext: 'File context',
  scanning: 'Scanning…',
  scanningDesign: 'Scanning your design…',
  reScan: 'Re-scan',
  statusReadyFile: 'Ready to scan the full file.',
  statusPickPages: 'Choose one or more pages to scan.',
  statusReadyOnePage: 'One page selected. Ready when you are.',
  statusReadyPages: '{count} pages selected. Ready when you are.',
  statusEmptySelection: 'Select something on the canvas to get started.',
  statusReadyOneLayer: 'Nice — one layer selected. Ready when you are.',
  statusReadyLayers: '{count} layers selected. Ready when you are.',
  preScanHelp:
    'Choose what to audit, then scan. The plugin stays offline and only changes the file when you confirm a Fix.',
  resultsHeading: 'Scan results',
  overviewPlaceholder:
    'Overview will show score, pass/issue counts, and category breakdown.',
  issuesPlaceholder:
    'Issues will list prioritized findings with why / impact / how to fix.',
  fileContextPlaceholder:
    'File context will show inventory and scan metadata for what was audited.'
} as const
