import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Pin } from '../types'
import { capOriginal, explainScroll, hasSteps, layoutLines, linesToPin, searchPhrase, splitMarker, visibleLines } from './pin-text'

const pinned = atom({ plugin: 'pin-click', key: 'pinned' } as const, null)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pin-goto',
      description: 'Scroll back to the reply the pin came from',
    })

    return next(e)
  })

  on('command.run', { command: 'pin-goto' }, async $ => {
    const pin = await read($, pinned)

    if (pin === null || pin.fromId === null) {
      return { text: 'Nothing pinned from a reply. Use the 📌 Pin steps button under a reply first.' }
    }

    const moved = await $.ui.scroll({ to: { requestId: pin.fromId }, block: 'start' })

    if (moved.deny === undefined) {
      return { text: 'Jumped back to the pinned reply.' }
    }

    const phrase = searchPhrase(pin.lines)
    const copied = await $.ui.copy({ text: phrase })

    return {
      text: copied.isCopied
        ? `This screen can't scroll to the reply. Copied "${phrase}": press Cmd+F, paste, Enter.`
        : `This screen can't scroll to the reply. Search for: "${phrase}" (Cmd+F).`,
    }
  })

  // Plan B: a Pin button under each reply that has steps.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary || !hasSteps(e.props.text)) {
      return next(e)
    }

    const { Box, Button, Markdown } = $.ui.resolve(e)
    const lines = linesToPin(e.props.text)

    return (
      <Box flexDirection="column">
        <Markdown text={e.props.text} />
        <Button
          key={`pin-${e.requestId}`}
          label="📌 Pin steps"
          onPress={() =>
            update(
              $,
              pinned,
              () =>
                ({
                  lines,
                  isOpen: false,
                  fromId: e.requestId,
                  original: capOriginal(e.props.text),
                  showOriginal: false,
                }) as Pin,
            )
          }
        />
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const pin = await read($, pinned)

    if (pin === null || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Button, Markdown, Text } = $.ui.resolve(e)
    const budget = Math.max(3, (e.props.maxRows ?? 8) - 2)
    const base = visibleLines(pin.lines, pin.isOpen)
    // Open: draw every line, so a list taller than the band scrolls in the engine's own window.
    const shown = pin.isOpen ? base : layoutLines(base, e.props.bodyColumns, Math.min(budget, 6)).shown
    const hidden = pin.lines.length - shown.length

    return (
      <Box flexDirection="column">
        <Box gap={1}>
          <Text bold>📌 Pinned · click</Text>
          {!pin.showOriginal && (pin.isOpen || hidden > 0) && (
            <Button
              key="toggle"
              label={pin.isOpen ? 'Show less' : `Show ${hidden} more`}
              onPress={() => update($, pinned, p => (p === null ? p : { ...p, isOpen: !p.isOpen }))}
            />
          )}
          {pin.original !== '' && (
            <Button
              key="original"
              label={pin.showOriginal ? '✕ Hide original' : '↩ Original'}
              onPress={() => update($, pinned, p => (p === null ? p : { ...p, showOriginal: !p.showOriginal }))}
            />
          )}
          {pin.fromId !== null && (
            <Button
              key="find"
              label="🔎 Find in chat"
              onPress={async press => {
                const moved = await $.ui.scroll({ to: { requestId: pin.fromId as string }, block: 'start' })

                if (moved.deny === undefined) {
                  return
                }

                // This screen will not scroll the chat for a plugin: hand over a phrase for the app's own find.
                const phrase = searchPhrase(pin.lines)
                const copied = await $.ui.copy({ text: phrase, surface: press.surface })

                $.ui.toast(
                  copied.isCopied
                    ? `Copied "${phrase}". Press Cmd+F, paste, Enter.`
                    : `Search for "${phrase}" with Cmd+F. (${explainScroll(moved.deny)})`,
                )
              }}
            />
          )}
          <Button key="unpin" label="Unpin" onPress={() => update($, pinned, () => null)} />
        </Box>
        {pin.showOriginal && <Markdown text={pin.original} />}
        {!pin.showOriginal && shown.map(line => {
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
