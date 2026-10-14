import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Pin } from '../types'
import { layoutLines, linesFromText, linesToPin, splitMarker, visibleLines } from './pin-text'

const pinned = atom({ plugin: 'pin', key: 'pinned' } as const, null)
const lastAnswer = atom({ plugin: 'pin', key: 'lastAnswer' } as const, '')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pin',
      description: 'Pin the last answer (or the text you type) above the prompt',
    })
    await $.command.register({
      name: 'unpin',
      description: 'Remove the pinned lines',
    })

    return next(e)
  })

  // Remember the assistant's last answer so /pin has something to keep. Kept in the session only.
  on('turn.complete', async ($, e, next) => {
    if (!e.isAborted && e.answer) {
      await update($, lastAnswer, () => e.answer)
    }

    return next(e)
  })

  on('command.run', { command: 'pin' }, async ($, e) => {
    const typed = e.args.trim()
    const lines = typed ? linesFromText(typed) : linesToPin(await read($, lastAnswer))

    if (lines.length === 0) {
      return { text: 'Nothing to pin yet. Ask something first, or type /pin followed by the text.' }
    }

    const fresh: Pin = { lines, isOpen: false }
    await update($, pinned, () => fresh)

    return { text: `Pinned ${lines.length} line${lines.length > 1 ? 's' : ''} above the prompt. /unpin to remove.` }
  })

  on('command.run', { command: 'unpin' }, async $ => {
    await update($, pinned, () => null)

    return { text: 'Unpinned.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const pin = await read($, pinned)

    if (pin === null || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const budget = Math.max(3, (e.props.maxRows ?? 8) - 2)
    const base = visibleLines(pin.lines, pin.isOpen)
    // Open: draw every line, so a list taller than the band scrolls in the engine's own window.
    const shown = pin.isOpen ? base : layoutLines(base, e.props.bodyColumns, Math.min(budget, 6)).shown
    const hidden = pin.lines.length - shown.length

    return (
      <Box flexDirection="column">
        <Box gap={1}>
          <Text bold>📌 Pinned</Text>
          {(pin.isOpen || hidden > 0) && (
            <Button
              key="toggle"
              label={pin.isOpen ? 'Show less' : `Show ${hidden} more`}
              onPress={() => update($, pinned, p => (p === null ? p : { ...p, isOpen: !p.isOpen }))}
            />
          )}
          <Button key="unpin" label="Unpin" onPress={() => update($, pinned, () => null)} />
        </Box>
        {shown.map(line => {
          const { marker, body } = splitMarker(line)

          return marker ? (
            <Box>
              <Text>{marker} </Text>
              <Box flexShrink={1}>
                <Text>{body}</Text>
              </Box>
            </Box>
          ) : (
            <Text>{body}</Text>
          )
        })}
      </Box>
    )
  })
}
