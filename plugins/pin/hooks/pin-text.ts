// Pure text helpers for the pin: no engine calls, so they are easy to test.

const STEP = /^\s*(\d+[.)]|[-*•])\s+/
const MAX_LINES = 14
const MAX_WIDTH = 400

function clean(line: string): string {
  return line
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Pick what to pin from an answer: its numbered or bulleted steps if it has at least two, else its first lines. */
export function linesToPin(answer: string): string[] {
  const all = answer.split('\n')
  const steps = all.filter(line => STEP.test(line))
  const picked = (steps.length >= 2 ? steps : all)
    .map(clean)
    .filter(line => line.length > 0)
    .slice(0, MAX_LINES)

  return picked.map(line => (line.length > MAX_WIDTH ? `${line.slice(0, MAX_WIDTH - 1)}…` : line))
}

/**
 * Split steps typed on one line ("1. a 2. b 3. c") into one line each. It splits only where the numbers
 * count up from 1 in order, so "Meet at 5. Then go home" and "in 2026. 5 apples" stay whole.
 */
export function splitInlineSteps(line: string): string[] {
  const marker = /(^|\s)(\d{1,2})[.)]\s+/g
  const starts: number[] = []
  let expected = 1
  let m: RegExpExecArray | null

  while ((m = marker.exec(line)) !== null) {
    if (Number(m[2]) === expected) {
      starts.push(m.index + (m[1] ?? '').length)
      expected += 1
    }
  }

  if (starts.length < 2 || starts[0] !== 0) {
    return [line]
  }

  return starts.map((start, i) => line.slice(start, starts[i + 1] ?? line.length).trim())
}

/** Lines of text the person typed after /pin: one per line break, and one per numbered step typed inline. */
export function linesFromText(text: string): string[] {
  return text
    .split('\n')
    .flatMap(line => splitInlineSteps(line.trim()))
    .map(clean)
    .filter(line => line.length > 0)
    .slice(0, MAX_LINES)
}

/** What the band shows: a few lines when closed, all of them when open. */
export function visibleLines(lines: string[], isOpen: boolean, closedCount = 3): string[] {
  return isOpen ? lines : lines.slice(0, closedCount)
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
