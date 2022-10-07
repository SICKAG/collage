export type SimpleTopicsAPI = {
  publish: (topic: string, message: unknown) => void,
  subscribe: (topic: string, callback: (message: unknown) => unknown) => () => void,
}

export type InternalTopicsAPI = {
  topicsPlugin: SimpleTopicsAPI & {
    distribute: (topic: string, message: unknown) => void,
    getCurrentValue: (topic: string) => unknown,
    publish: (topic: string, message: unknown) => void,
  }
}
