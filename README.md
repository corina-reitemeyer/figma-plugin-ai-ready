# Agent-Readiness Checker

Figma plugin that audits open-file components for **MCP / agent-readiness** — whether an AI coding agent (via Figma’s MCP / Code Connect ecosystem) can reliably translate them into code.

**Status:** v1. Offline Plugin API only (`networkAccess: none`).

## What it checks (v1)

| Category | Signals |
| --- | --- |
| Naming | Default / opaque component names |
| Tokens | Hard-coded paints vs variables / `inferredVariables` |
| Variants | Incomplete variant matrices on component sets |
| Structure | Auto Layout usage; optional muteable structural heuristic |
| Docs & Publish | Missing descriptions; unpublished library components |

**Not in v1:** Code Connect mapping coverage, Values Issues scope, assisted/bulk fixes, REST cross-file audits. Those are planned for v2 (Code Connect via offline CLI JSON import — not a live network call).

## Security & privacy

- Fully **offline** — `networkAccess.allowedDomains: ["none"]`. No analytics or telemetry.
- **Read-mostly:** scans the open file and selects/zooms to nodes on request.
- **Confirmed writes only:** rename and bind-inferred auto-fixes run only after an explicit confirm dialog; use Figma Undo to revert.
- Layer names, descriptions, and other file strings are treated as **untrusted text** in the UI (escaped / text-only rendering).
- No file contents leave the Figma desktop process.

## Demo script (~3 minutes)

1. Open a design-system or component library file in **Figma Desktop**.
2. Run `npm run build`, then Quick Actions → **Import plugin from manifest…** → select repo-root `manifest.json`.
3. Launch **Agent-Readiness Checker**.
4. Choose scope: **Full file** (default), **Specific pages**, or **Selection / frame / component** → **Scan**. The last scope choice is remembered.
5. On **Overview**, note overall score / band and top issues; click an issue to select it on the canvas.
6. Open **Issues**, expand a finding, read Why / Consequence / How to fix.
7. For a rename or bind-inferred finding, click **Fix** → confirm → verify Undo works.
8. Open **File context** for inventory and the Code Connect v1 deferral note.

## Assistive tech smoke checklist

Run after UI changes (VoiceOver on macOS or NVDA on Windows):

- [ ] Scope select and page checkboxes are announced with labels/legends.
- [ ] **Scan** / **Cancel** are reachable by Tab; Cancel works during a long scan.
- [ ] Scan progress updates are announced via the live region (polite).
- [ ] Results tabs are arrow-key navigable; active tab panel is associated.
- [ ] Issue **Show details** toggles `aria-expanded`; Fix confirm dialog has a labelled title.
- [ ] Focus is not trapped unexpectedly after Apply / Cancel / Re-scan.
- [ ] Automated: `npm test` (includes axe checks on main views).

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
