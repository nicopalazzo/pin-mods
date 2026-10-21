import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Pin } from '../types'
import {
  capOriginal,
  explainScroll,
  fromShelf,
  hasSteps,
  layoutLines,
  linesFromText,
  linesToPin,
  refreshPrompt,
  searchPhrase,
  shelfPrompt,
  splitMarker,
  toggleDone,
  visibleLines,
} from './pin-text'

const pinned = atom({ plugin: 'pin', key: 'pinned' } as const, null)
const lastAnswer = atom({ plugin: 'pin', key: 'lastAnswer' } as const, '')

const registerAll = async ($: EngineInterface) => {
  await $.command.register({
    name: 'pin',
    description: 'Pin the last answer (or the text you type) above the prompt',
  })
  await $.command.register({
    name: 'unpin',
    description: 'Remove the pinned lines',
  })
  await $.command.register({
    name: 'pin-goto',
    description: 'Scroll back to the reply the pin came from',
  })
  await $.tool.register({
    name: 'pin_from_shelf',
    description:
      "Show a Steps shelf entry in the pin above the user's prompt, with each step's done state. " +
      'Call it after you add steps to the shelf, and when the user asks to refresh the pin from the shelf. ' +
      'Pass the entry id and ALL its steps in order. Calling it again replaces the pin.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The shelf entry id, such as p-surprise-dinner' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: { text: { type: 'string' }, done: { type: 'boolean' } },
            required: ['text'],
          },
          description: 'All the entry steps in order',
        },
      },
      required: ['id', 'steps'],
    },
    isDeferred: false,
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await registerAll($)

    return next(e)
  })

  // /clear and /resume continue under a new session id without a session.start, so the commands vanish.
  // Register them again once a command has moved the session.
  on('command.run', async ($, e, next) => {
    const session = await $.session.id()
    const result = await next(e)

    if ((await $.session.id()) !== session) {
      await registerAll($).catch(() => undefined)
    }

    return result
  }).catch(($, e, next) => next(e))

  // /clear fires session.end with reason 'clear' and no session.start after it.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await registerAll($).catch(() => undefined)
    }

    return next(e)
  })

  // Remember the assistant's last answer so /pin has something to keep. Kept in the session only.
  on('turn.complete', async ($, e, next) => {
    if (!e.isAborted && e.answer) {
      await update($, lastAnswer, () => e.answer)
    }

    return next(e)
  })

  on('tool.call', { tool: 'mcp__pin__pin_from_shelf' }, async ($, e) => {
    const shelf = fromShelf(e as { id?: unknown; steps?: unknown })

    if (shelf === null) {
      return { result: 'Nothing was pinned: the entry id or its steps were missing.' }
    }

    const fresh: Pin = {
      lines: shelf.lines,
      isOpen: true,
      fromId: null,
      original: '',
      showOriginal: false,
      done: shelf.done,
      shelfId: shelf.shelfId,
    }
    await update($, pinned, () => fresh)

    return { result: `The pin now shows shelf entry ${shelf.shelfId} (${shelf.done.length}/${shelf.lines.length} done).` }
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'pin' }, async ($, e) => {
    const typed = e.args.trim()
    const answer = typed ? '' : await read($, lastAnswer)
    const lines = typed ? linesFromText(typed) : linesToPin(answer)

    if (lines.length === 0) {
      return { text: 'Nothing to pin yet. Ask something first, or type /pin followed by the text.' }
    }

    const fresh: Pin = { lines, isOpen: false, fromId: null, original: capOriginal(answer), showOriginal: false }
    await update($, pinned, () => fresh)

    return { text: `Pinned ${lines.length} line${lines.length > 1 ? 's' : ''} above the prompt. /unpin to remove.` }
  })

  on('command.run', { command: 'unpin' }, async $ => {
    await update($, pinned, () => null)

    return { text: 'Unpinned.' }
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

  // A Pin button under each reply that has steps: it pins any reply, not only the last one.
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
          <Text bold>{pin.shelfId === undefined ? '📌 Pinned' : '📌 Pinned · on the shelf'}</Text>
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
          {pin.original !== '' && (
            <Button
              key="find"
              label="🔎 Find in chat"
              onPress={async press => {
                const moved =
                  pin.fromId === null
                    ? { deny: 'no reply id (pinned with /pin)' }
                    : await $.ui.scroll({ to: { requestId: pin.fromId }, block: 'start' })

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
          <Button
            key="shelf"
            label={pin.shelfId === undefined ? '➕ Shelf' : '↻ Shelf'}
            onPress={() =>
              $.prompt.submit({
                text: pin.shelfId === undefined ? shelfPrompt(pin.lines, pin.done) : refreshPrompt(pin.shelfId),
                asUser: true,
              })
            }
          />
          <Button key="unpin" label="Unpin" onPress={() => update($, pinned, () => null)} />
        </Box>
        {pin.showOriginal && <Markdown text={pin.original} />}
        {!pin.showOriginal &&
          shown.map((line, i) => {
            const { marker, body } = splitMarker(line)
            const isDone = (pin.done ?? []).includes(i)

            return (
              <Box key={`row-${i}`} gap={1}>
                {pin.shelfId === undefined ? (
                  <Button
                    key={`tick-${i}`}
                    plain
                    label={isDone ? '☑' : '☐'}
                    onPress={() => update($, pinned, p => (p === null ? p : { ...p, done: toggleDone(p.done, i) }))}
                  />
                ) : (
                  <Text>{isDone ? '☑' : '☐'}</Text>
                )}
                <Box flexShrink={1}>
                  <Text dimColor={isDone}>{marker ? `${marker} ${body}` : body}</Text>
                </Box>
              </Box>
            )
          })}
      </Box>
    )
  })
}
