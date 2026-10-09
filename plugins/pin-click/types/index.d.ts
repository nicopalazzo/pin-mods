export type Pin = {
  lines: string[]
  isOpen: boolean
  fromId: string | null
  original: string
  showOriginal: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'pin-click': { pinned: Pin | null }
  }
}
