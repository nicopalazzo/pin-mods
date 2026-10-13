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

const TABLE_ROW = /^\s*\|.*\|\s*$/
const TABLE_RULE = /^\s*\|[\s:|-]+\|\s*$/
const CALL_TO_ACTION = /❓|🎯|📍|✍️|\byour (turn|call|pick)\b|\bnext\b/i

/**
 * Body rows of the last table, as "first cell → other cells", but only when a call to action
 * (❓, 🎯, "Your turn", "Next"…) comes after it: a table you must act on, not one to read.
 */
function tableSteps(lines: string[]): string[] {
  const lastRow = lines.findLastIndex(line => TABLE_ROW.test(line))

  if (lastRow === -1 || !lines.slice(lastRow + 1).some(line => CALL_TO_ACTION.test(line))) {
    return []
  }

  let first = lastRow
  while (first > 0 && TABLE_ROW.test(lines[first - 1] ?? '')) first--

  const rows = lines.slice(first, lastRow + 1)
  const body = rows.length >= 2 && TABLE_RULE.test(rows[1] ?? '') ? rows.slice(2) : rows

  return body
    .map(row => row.trim().replace(/^\||\|$/g, '').split('|').map(clean).filter(cell => cell.length > 0))
    .filter(cells => cells.length > 0)
    .map(([head, ...rest]) => (rest.length > 0 ? `${head} → ${rest.join(' · ')}` : (head ?? '')))
}

/** Numbered or bulleted steps if there are at least two, else the rows of a table followed by a call to action. */
function stepLines(answer: string): string[] {
  const all = answer.split('\n')
  const steps = all.filter(line => STEP.test(line))

  return steps.length >= 2 ? steps : tableSteps(all)
}

/** Pick what to pin from an answer: its steps (list or actionable table) if it has at least two, else its first lines. */
export function linesToPin(answer: string): string[] {
  const steps = stepLines(answer)
  const picked = (steps.length >= 2 ? steps : answer.split('\n'))
    .map(clean)
    .filter(line => line.length > 0)
    .slice(0, MAX_LINES)

  return picked.map(line => (line.length > MAX_WIDTH ? `${line.slice(0, MAX_WIDTH - 1)}…` : line))
}

/** Lines of text the person typed after /pin. */
export function linesFromText(text: string): string[] {
  return text
    .split('\n')
    .map(clean)
    .filter(line => line.length > 0)
    .slice(0, MAX_LINES)
}

/** What the band shows: a few lines when closed, all of them when open. */
export function visibleLines(lines: string[], isOpen: boolean, closedCount = 3): string[] {
  return isOpen ? lines : lines.slice(0, closedCount)
}

/** True when an answer has at least two steps: list lines, or table rows followed by a call to action. */
export function hasSteps(answer: string): boolean {
  return stepLines(answer).length >= 2
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

/** Plain words for why a jump back to the original reply did not move. Empty when it moved. */
export function explainScroll(deny: string | undefined): string {
  if (deny === undefined) {
    return ''
  }

  if (deny.includes('not person-initiated')) {
    return "Can't jump back from there. Try the ↩ Original button in the band."
  }

  if (deny.includes('not scrollable') || deny.includes('none scrolls')) {
    return "This screen doesn't let a plugin scroll the chat, so the pin can't take you to the reply."
  }

  return `Couldn't jump back: ${deny}`
}

/**
 * The phrase to look for in the chat with the app's find: the first pinned line without its list marker,
 * cut at a word boundary so it stays short and matches what the chat draws.
 */
export function searchPhrase(lines: string[], maxLength = 40): string {
  const first = splitMarker(lines[0] ?? '').body.trim()

  if (first.length <= maxLength) {
    return first
  }

  const cut = first.slice(0, maxLength)
  const space = cut.lastIndexOf(' ')

  return (space > 15 ? cut.slice(0, space) : cut).trim()
}

const MAX_ORIGINAL = 8000

/** Keep the pinned reply whole, up to a cap, so a very long answer cannot fill the session's memory. */
export function capOriginal(text: string, max = MAX_ORIGINAL): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
