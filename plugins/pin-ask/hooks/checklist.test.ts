import { expect, test } from 'claude-code/testing'

import { progress, toItems, toTitle, toggle } from './checklist'

test('keeps clean, short lines and at most eight', () => {
  const items = toItems(['  one ', '', 'two', 3, 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'])

  expect(items.map(item => item.text)).toEqual(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'])
  expect(items.every(item => item.isDone === false)).toBe(true)
})

test('gives nothing for input that is not a list', () => {
  expect(toItems('not a list')).toEqual([])
  expect(toItems(undefined)).toEqual([])
})

test('title falls back to Pinned', () => {
  expect(toTitle('Plan B')).toBe('Plan B')
  expect(toTitle('   ')).toBe('Pinned')
  expect(toTitle(undefined)).toBe('Pinned')
})

test('ticking one line leaves the others alone and counts progress', () => {
  const items = toggle(toItems(['a', 'b', 'c']), 1)

  expect(items.map(item => item.isDone)).toEqual([false, true, false])
  expect(progress(items)).toBe('1/3')
})

import { layoutLines } from './checklist'

test('fits lines into the row budget and counts what is left out', () => {
  const { shown, hidden } = layoutLines(['short', 'z'.repeat(100), 'last'], 50, 4)

  expect(shown).toEqual(['short', 'z'.repeat(100)])
  expect(hidden).toBe(1)
})
