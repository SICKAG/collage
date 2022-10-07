export type ServiceTopicsAPI = {
  [topic: string]: {
    publish: (message: unknown) => void,
    subscribe: (callback: (message: unknown) => unknown) => string,
    unsubscribe: (subscriptionId: string) => void,
  }
}
