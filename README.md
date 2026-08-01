# Agent-Readiness Checker

Figma plugin that audits open-file components for **MCP / agent-readiness** — whether an AI coding agent (via Figma’s Code Connect / MCP integration) can reliably translate them into code.

**Status:** v1 scaffold. Offline Plugin API only (`networkAccess: none`).

## Security & privacy

- Works fully **offline** — no network requests, analytics, or telemetry.
- v1 is **read-mostly**: scans the open file and (in later sub-tasks) selects nodes; confirmed auto-fixes will only run when you click **Fix**.
- File layer names and descriptions are treated as untrusted text in the UI (no HTML injection).

## Development

### Prerequisites

- [Node.js](https://nodejs.org) v20+
- [Figma desktop app](https://www.figma.com/downloads/)

### Scripts

```bash
npm install
npm run build      # typecheck + production bundle → manifest.json + build/
npm run watch      # rebuild on change
npm run typecheck
npm run lint
npm test
```

### Install in Figma

1. Run `npm run build` (or `npm run watch`).
2. In Figma: Quick Actions → **Import plugin from manifest…**
3. Select the generated `manifest.json` at the repo root.

## Repository

https://github.com/corina-reitemeyer/figma-plugin-ai-ready

## License

MIT
