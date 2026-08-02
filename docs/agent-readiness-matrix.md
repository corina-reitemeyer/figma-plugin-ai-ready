# Agent readiness matrix

What AI coding agents need from Figma (via MCP), what this offline plugin can detect or fix, and what stays deferred.

**Product principle:** no fake success on empty scopes; earned Good when auditable checks pass; Code Connect / MCP IR stay out of the score denominator (footnote only).

## Agent needs (MCP path)

| Need | Why it matters |
| --- | --- |
| Auto Layout tree | Flex/gap/padding IR; otherwise absolute positioning |
| Bound variables (+ `codeSyntax` when set) | Tokens as named vars, not raw hex/px |
| Real components / instances | Reuse and Code Connect hooks |
| Complete variant sets | Props map correctly |
| Semantic names | Layer → widget intent |
| Code Connect | Real imports/snippets in the codebase |
| Descriptions / annotations | Behavior beyond pixels |
| Manageable frame size | Avoid IR truncation |
| Published library (when relevant) | Remote MCP / Code Connect reliability |

Two lanes: **design-system readiness** (library components, tokens, variants, docs) vs **page/frame readiness** (instances, composition Auto Layout). v1 scores the DS signals below.

## Plugin connectivity (offline)

| Signal | Offline Plugin API | This plugin | Fix tier |
| --- | --- | --- | --- |
| Component / set naming | Yes | Yes | **Auto-fix** (`rename-convention`) when default/opaque |
| Bound fills/strokes + unique inferred variable | Yes | Yes (top-level paints) | **Auto-fix** (`bind-inferred`) |
| Unbound colors (no unique inference) | Yes | Yes | **Manual** |
| Variant matrix completeness | Yes | Yes | **Manual** |
| Auto Layout on component | Yes | Yes (top-level / set defaultVariant) | **Manual** |
| Component descriptions | Yes | Yes | **Manual** |
| Publish status | Yes | Yes | **Manual** |
| Frames that look like components | Yes | Muteable heuristic | **Manual** |
| Instance as selection | Yes | Resolves to main component / set | (enables audit) |
| Variable `codeSyntax` | Yes | Not checked (backlog) | — |
| Nested tokens / deep Auto Layout | Yes | Partial / not deep-walked (backlog) | — |
| Code Connect mappings | **No** | Deferred (CLI JSON import) | Verify in Dev Mode |
| MCP design IR / screenshot parity | **No** | AI view is local preview only | Verify via MCP |
| Cross-file REST audits | Needs network | Out of v1 | — |

## Auto-fix vs Manual

**Auto-fix (plugin applies after confirm):**

- Rename opaque/default component names → PascalCase suggestion
- Bind a solid fill/stroke when exactly one inferred variable matches

**Manual (plugin detects + how-to; designer edits in Figma):**

- Add descriptions, publish library, fill missing variants, enable Auto Layout, bind ambiguous colors, convert reusable frames, fix weak property names

**Not claimed / not scored:**

- Code Connect mapped vs unmapped
- Whether MCP IR will look “right”
- Full Values Issues / unused-variable inventory (stubs only)

## Scoring honesty

| Situation | Score behavior |
| --- | --- |
| Zero auditable targets | **Not scored** — empty state, not Good 100 |
| Category with no applicable checks | **N/A** for that category (excluded from overall) |
| Applicable checks pass | **Earned Good** is correct and desirable |
| Code Connect missing | Footnote only — does **not** lower the score |

## Backlog (not this release)

- Code Connect CLI JSON import
- Deep-tree token / Auto Layout rules
- `codeSyntax` checks
- Page-composition scorecard (instance density, detachment)
- Network / REST cross-file audits
