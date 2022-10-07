/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { ServiceIdentification, TransactionObject } from './service-registry';

export interface ChildApi {
  //  get current services of child
  getServices: () => [string],

  // update services of child
  setServices: (serviceRegistrySnippet: Map<string, string>) => void,

  // overwrite css variables to allow theming
  overwriteCssVariables: (cssVariables: Map<string, string>, recursively?: boolean) => void,

  // get context id of child
  getContextId: () => string,

  // call a service directly on a specific context
  callServiceDirectly: (callObject: { service: ServiceIdentification, method: string, args: Array<unknown> }) => Promise<unknown>,

  // call a specific service of child
  callServiceWithBackchannel: (callObject: { transactionObject: TransactionObject, service: ServiceIdentification, method: string, args: Array<unknown> }) => Promise<void>

  // respond a potential return value to the parent or child context, if not using service from own callback map
  respondToServiceCall: (callObject: { transactionObject: TransactionObject, returnValueObject: unknown }) => Promise<void>,

  // Redirect the new, published value of a topic to the corresponding observable of the child context
  publishValueOnObservable: (transactionObject: TransactionObject, service: ServiceIdentification, returnValue: unknown) => void,

  // Remove subscriber from subscribers callback map
  removeFromSubscriptionCallbackMap: (transactionObject: TransactionObject, service: ServiceIdentification) => void,

  // Remove transaction from transaction resolve map
  removeFromTransactionResolveMap: (transactionObject: TransactionObject) => void,

  // Check if descendant with context id has a service implementation for a specific service
  hasServiceImplementation: (serviceIdent: ServiceIdentification, contextId: string) => Promise<boolean>,

  // Disconnect from parent
  disconnect: () => void

  // Get descendants
  getDescendants: () => Array<string>,

  // Get subscriptions of a descendant with context id
  getSubscriptions: (contextId: string) => Promise<string[]>,

  // Get subscription callback map of a descendant with context id
  getSubscriptionCallbackMap: (contextId: string) => Promise<Map<string, Array<TransactionObject>>>,

  // Update subscribersCallbackMap of a child with context id
  updateSubscribersCallbackMap: (subscribersCallbackSnippet: Map<string, Array<TransactionObject>>, contextId: string) => void,

  //  Resolves callback, when parent is done with initialization (registering services and children)
  initDone: () => void
}
