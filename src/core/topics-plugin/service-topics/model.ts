export type ServiceTopic = {
  publish: (message: unknown) => void,
  subscribe: (callback: (message: unknown) => unknown) => string,
  unsubscribe: (subscriptionId: string) => void,
}

export type ServiceTopicsAPI = {
  [topic: string]: ServiceTopic;
}
