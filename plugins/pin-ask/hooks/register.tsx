import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Checklist } from '../types'
import { layoutLines, progress, toItems, toTitle, toggle } from './checklist'

const checklist = atom({ plugin: 'pin-ask', key: 'checklist' } as const, null)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: 'pin',
      description:
        "Pin a short checklist above the user's prompt so it stays visible while the chat scrolls. " +
        'Call it ONLY when the user asks you to pin something. Give a short title and at most 8 short lines ' +
        '(the steps or points to keep, in the order to follow them). Calling it again replaces the pinned list.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'A short title, a few words' },
          lines: { type: 'array', items: { type: 'string' }, description: 'The lines to keep, short, at most 8' },
        },
        required: ['lines'],
      },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'unpin',
      description: 'Remove the pinned checklist. Call it ONLY when the user asks you to unpin.',
      inputSchema: { type: 'object', properties: {} },
      isDeferred: false,
    })

    return next(e)
  })

  on('tool.call', { tool: 'mcp__pin-ask__pin' }, async ($, e) => {
    const items = toItems((e as { lines?: unknown }).lines)

    if (items.length === 0) {
      return { result: 'Nothing was pinned: no lines were given.' }
    }

    const next: Checklist = { title: toTitle((e as { title?: unknown }).title), items }
    await update($, checklist, () => next)

    return { result: `Pinned ${items.length} line${items.length > 1 ? 's' : ''} above the prompt.` }
  })

  on('tool.call', { tool: 'mcp__pin-ask__unpin' }, async $ => {
    await update($, checklist, () => null)

    return { result: 'Unpinned.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, checklist)

    if (list === null || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const budget = Math.max(3, (e.props.maxRows ?? 8) - 2)
    const { shown } = layoutLines(list.items.map(item => item.text), e.props.bodyColumns, budget)
    const shownCount = shown.length

    return (
      <Box flexDirection="column">
        <Box gap={1}>
          <Text bold>
            📌 {list.title} · ask · {progress(list.items)}
          </Text>
          <Button key="unpin" label="Unpin" onPress={() => update($, checklist, () => null)} />
        </Box>
        {list.items.slice(0, shownCount).map((item, i) => (
          <Box key={`row-${i}`} gap={1}>
            <Button
              key={`item-${i}`}
              plain
              label={item.isDone ? '☑' : '☐'}
              onPress={() => update($, checklist, c => (c === null ? c : { ...c, items: toggle(c.items, i) }))}
            />
            <Box flexShrink={1}>
              <Text dimColor={item.isDone}>{item.text}</Text>
            </Box>
          </Box>
        ))}
        {shownCount < list.items.length && <Text dimColor>… {list.items.length - shownCount} more</Text>}
      </Box>
    )
  })
}
