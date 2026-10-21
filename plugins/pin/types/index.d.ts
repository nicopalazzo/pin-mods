export type Pin = {
  lines: string[]
  isOpen: boolean
  /** The reply the pin came from, when pinned with the button; null when pinned with /pin. */
  fromId: string | null
  /** The full reply the lines came from ('' when the person typed the text). */
  original: string
  showOriginal: boolean
}

declare module 'claude-code' {
  interface PluginState {
    pin: { pinned: Pin | null; lastAnswer: string }
  }
}
