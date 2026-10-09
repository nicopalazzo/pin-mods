export type Pin = { lines: string[]; isOpen: boolean }

declare module 'claude-code' {
  interface PluginState {
    pin: { pinned: Pin | null; lastAnswer: string }
  }
}
