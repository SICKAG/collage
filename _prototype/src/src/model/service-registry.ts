/* eslint-disable max-len */
/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { AsyncMethodReturns } from 'penpal/lib/types';
import { BehaviorSubject } from 'rxjs';
import { ChildApi } from './childApi';

/**
 * a service is identified by its profile id
 */
export type ServiceRegistry = Map<string, string>;

/**
 * A service describes the relation between a profile and its providing context identified by id;
 */

/**
 * A service identified by its id and version providing an implementation to call
 */
export type Service = { id: string } & ServiceBase

export type IncompleteService = { id: string | null } & ServiceBase

type ServiceBase = {
  version: string,
  impl?: (method?: string, args?: Array<unknown>) => unknown,
  isSubscribable?: boolean,
  subscriptionTopics?: Array<string>
}

/**
 * A service identified by its id and version
 */
export type ServiceIdentification = { id: string, version: string }

/**
 * Transaction Object used to identify the inquirer of a service call to be able to report a result
 */
export type TransactionObject = { inquirerContextId: string, transactionId: string, topic?: string, type: MethodType, publishValue?: string }

/**
 * Child context object. If isDirectDescendant is true, the child is from type AsyncMethodReturns<CallSender, string>,
 * otherwise its from type string with the contextId of the direct child, which has the child context as descendant
 */
export type ChildContext = {
  child: AsyncMethodReturns<ChildApi> | string,
  iframe?: Element
  isDirectDescendant: boolean
}

export type ChildContextMap = Map<string, ChildContext>;

export type SubscriptionMap = Map<string, BehaviorSubject<unknown>>;

/**
 * Possible method types of the callable services
 */
// eslint-disable-next-line no-shadow
export enum MethodType {
  PUBLISH = 'publish',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  OTHER = 'other'
}

export const topicError = 'Invalid topic. This service does not contain a topic called ';
