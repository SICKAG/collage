/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { ChildIdentity } from 'src/elements/fragment';
import {
  ChildContextMap,
  Service,
  ServiceIdentification,
  TransactionObject
} from './service-registry';

export interface ParentApi {
  // call a service of parent
  callServiceWithBackchannel: (data: { transactionObject: TransactionObject, service: Service, method: string, args: Array<unknown> }) => Promise<void>,
  // return response of a service to parent context for further handling
  respondToServiceCall: (data: { transactionObject: TransactionObject, returnValueObject: unknown }) => Promise<void>,
  // register new child contexts to parent
  registerChildContext: (childContextId: string, childDescendantMap: ChildContextMap, updatedServiceRegistry: Map<string, string>) => void,
  // Redirect the new, published value of a topic to the corresponding observable of the parent context
  publishValueOnObservable: (transactionObject: TransactionObject, service: ServiceIdentification, returnValue: unknown) => void,
  // Remove subscriber from subscribers callback map
  removeFromSubscriptionCallbackMap: (transactionObject: TransactionObject, service: ServiceIdentification) => void,
  // Remove transaction from transaction resolve map
  removeFromTransactionResolveMap: (transactionObject: TransactionObject) => void,
  // Unregister the service implementations from the deregistered ids and exchange them with others
  deregisterServices: (services: Array<ServiceIdentification>, deregisteredIds: Array<string>, force: boolean) => Promise<void>
  // Deregister children of child context map from parent
  deregisterFromChildContextMap: (deregisteredIds: Array<string>) => Promise<void>,
  // Update subscribersCallbackMap of parent
  updateSubscribersCallbackMap: (subscribersCallbackSnippet: Map<string, Array<TransactionObject>>, contextId: string) => Map<string, Array<TransactionObject>>,
  // Get css variables map for style synchronization
  getCssVariables: () => Map<string, string> | null,

  getConfig: (childId: string) => ChildIdentity,
}
