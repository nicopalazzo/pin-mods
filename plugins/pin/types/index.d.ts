export type Pin = {
  lines: string[]
  isOpen: boolean
  /** The reply the pin came from, when pinned with the button; null when pinned with /pin. */
  fromId: string | null
  /** The full reply the lines came from ('' when the person typed the text). */
  original: string
  showOriginal: boolean
  /** Indexes of the lines the person ticked off in the band. */
  done?: number[]
  /** The Steps shelf entry this pin shows. Set by the pin_from_shelf tool; its ticks then come from the shelf. */
  shelfId?: string
}

declare module 'claude-code' {
  interface PluginState {
    pin: { pinned: Pin | null; lastAnswer: string }
  }
}
