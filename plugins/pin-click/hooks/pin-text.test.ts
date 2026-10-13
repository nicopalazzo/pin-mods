import { expect, test } from 'claude-code/testing'

import { capOriginal, explainScroll, hasSteps, linesToPin, searchPhrase } from './pin-text'

test('a reply with two or more steps gets a Pin button', () => {
  expect(hasSteps('Plan:\n1. First\n2. Second')).toBe(true)
  expect(hasSteps('Just a sentence.')).toBe(false)
  expect(hasSteps('Only one:\n- item')).toBe(false)
})

test('pins the steps of the clicked reply, cleaned of markdown', () => {
  expect(linesToPin('Plan:\n1. **Write** it\n2. Run `tests`')).toEqual(['1. Write it', '2. Run tests'])
})

import { layoutLines, splitMarker } from './pin-text'

test('splits a list marker so wrapped rows line up under the text', () => {
  expect(splitMarker('1. Write the file')).toEqual({ marker: '1.', body: 'Write the file' })
  expect(splitMarker('- a point')).toEqual({ marker: '-', body: 'a point' })
  expect(splitMarker('plain text')).toEqual({ marker: '', body: 'plain text' })
})

test('fits whole lines into the row budget and counts what is left out', () => {
  const long = 'x'.repeat(100)
  const { shown, hidden } = layoutLines(['short', long, 'last'], 50, 4)

  expect(shown).toEqual(['short', long])
  expect(hidden).toBe(1)
})

test('cuts a single very long line with an ellipsis instead of showing nothing', () => {
  const { shown } = layoutLines(['y'.repeat(500)], 40, 2)

  expect(shown.length).toBe(1)
  expect(shown[0]?.endsWith('…')).toBe(true)
})

test('says nothing when the jump back worked, and explains when it did not', () => {
  expect(explainScroll(undefined)).toBe('')
  expect(explainScroll('not person-initiated')).toContain('↩ Original')
  expect(explainScroll('transcript not scrollable here')).toContain("doesn't let a plugin scroll")
  expect(explainScroll('none scrolls')).toContain("doesn't let a plugin scroll")
  expect(explainScroll('weird reason')).toBe("Couldn't jump back: weird reason")
})

test('the search phrase is the first pinned line without its marker, cut at a word', () => {
  expect(searchPhrase(['1. Write the file'])).toBe('Write the file')
  expect(searchPhrase(['- A very long first line that keeps going well past forty characters in total'])).toBe(
    'A very long first line that keeps going',
  )
  expect(searchPhrase([])).toBe('')
})

test('keeps a short original whole and cuts a very long one with an ellipsis', () => {
  expect(capOriginal('short reply')).toBe('short reply')

  const cut = capOriginal('a'.repeat(100), 50)

  expect(cut.length).toBe(50)
  expect(cut.endsWith('…')).toBe(true)
})

const ACTION_TABLE = [
  '| Section | Mode |',
  '|---|---|',
  '| **Voice-heavy** | You write, I give feedback |',
  '| Fact-heavy | I fix facts, you tune |',
  '',
  '❓ **Your call:** use this split?',
].join('\n')

test('a table followed by a call to action gets a Pin button, one line per row', () => {
  expect(hasSteps(ACTION_TABLE)).toBe(true)
  expect(linesToPin(ACTION_TABLE)).toEqual([
    'Voice-heavy → You write, I give feedback',
    'Fact-heavy → I fix facts, you tune',
  ])
})

test('a table with no call to action after it stays a table to read', () => {
  const reference = ['| | A | B |', '|---|---|---|', '| Trigger | auto | asked |', '| Where | reply | tool |'].join('\n')

  expect(hasSteps(reference)).toBe(false)
  expect(hasSteps(`🎯 Next: compare them\n\n${reference}`)).toBe(false)
})

test('list steps still win over a table', () => {
  expect(linesToPin(`- one\n- two\n\n${ACTION_TABLE}`)).toEqual(['- one', '- two'])
})
