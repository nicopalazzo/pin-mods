export type Checklist = { title: string; items: { text: string; isDone: boolean }[] }

declare module 'claude-code' {
  interface PluginState {
    'pin-ask': { checklist: Checklist | null }
  }
}
