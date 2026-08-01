import { ScoreBand } from './types'

/** Lighthouse-like bands: Good ≥90, Needs work 50–89, Poor &lt;50. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 90) {
    return 'good'
  }
  if (score >= 50) {
    return 'needsWork'
  }
  return 'poor'
}

export function clampScore(score: number): number {
  if (Number.isNaN(score)) {
    return 0
  }
  return Math.min(100, Math.max(0, Math.round(score)))
}
