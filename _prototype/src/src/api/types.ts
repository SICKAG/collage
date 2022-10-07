/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */
export type Obj<T> = Record<string, T>;

export type ServiceFunctions = Obj<CallableFunction>

export type ServiceDescription = CallableFunction | ComplexService

export type ComplexService = SubscribableService | ServiceFunctions

export type SubscribableService = { topics?: Array<string> }

export type ServiceMap = Record<string, ServiceDescription>

export type ConfigDescriptor = Obj<Obj<unknown>>;

export type FrontendDescription = {
  services?: ServiceMap,
  config?: ConfigDescriptor,
} & SelfServiceDescription

export type SelfServiceDescription = {
  functions?: ServiceFunctions
}

export type TopicApi = { [topic: string]: {
  publish: CallableFunction,
  subscribe: CallableFunction,
  unsubscribe: CallableFunction
} }

export type ContextApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: Obj<any>, // FIXME better types
  children: Obj<ServiceFunctions>,
  topics: { [service: string]: TopicApi},
  config: Obj<unknown>,
  id: string
}
