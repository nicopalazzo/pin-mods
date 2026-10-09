// Pure helpers for the Claude-written checklist: no engine calls, easy to test.

const MAX_ITEMS = 8
const MAX_WIDTH = 160

export type Item = { text: string; isDone: boolean }

/** Turn what the model sent into clean items: strings only, trimmed, no empties, short, at most 8. */
export function toItems(lines: unknown): Item[] {
  if (!Array.isArray(lines)) {
    return []
  }

  return lines
    .filter((line): line is string => typeof line === 'string')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .slice(0, MAX_ITEMS)
    .map(line => ({ text: line.length > MAX_WIDTH ? `${line.slice(0, MAX_WIDTH - 1)}…` : line, isDone: false }))
}

/** The title the model gave, or a plain default. */
export function toTitle(title: unknown): string {
  return typeof title === 'string' && title.trim() ? title.trim().slice(0, 60) : 'Pinned'
}

/** Flip one item's done state without touching the others. */
export function toggle(items: Item[], index: number): Item[] {
  return items.map((item, i) => (i === index ? { ...item, isDone: !item.isDone } : item))
}

/** "2/5" progress text. */
export function progress(items: Item[]): string {
  return `${items.filter(item => item.isDone).length}/${items.length}`
}

const MARKER = /^(\d+[.)]|[-*•])\s+(.*)$/

/** Split a leading list marker ("1.", "-") from the text, so wrapped rows can line up under the text. */
export function splitMarker(line: string): { marker: string; body: string } {
  const m = MARKER.exec(line)

  return m ? { marker: m[1] ?? '', body: m[2] ?? '' } : { marker: '', body: line }
}

/**
 * Fit lines into a row budget when each line wraps at `columns`: keep whole lines while they fit,
 * cut the first line with an ellipsis if even it does not fit, and report how many lines are left out.
 */
export function layoutLines(lines: string[], columns: number, rowBudget: number): { shown: string[]; hidden: number } {
  const width = Math.max(20, columns - 4)
  const rowsOf = (line: string) => Math.max(1, Math.ceil(line.length / width))
  const shown: string[] = []
  let used = 0

  for (const line of lines) {
    const rows = rowsOf(line)

    if (used + rows > rowBudget) {
      if (shown.length === 0) {
        shown.push(`${line.slice(0, Math.max(1, width * rowBudget - 1))}…`)
      }
      break
    }

    shown.push(line)
    used += rows
  }

  return { shown, hidden: lines.length - shown.length }
}
