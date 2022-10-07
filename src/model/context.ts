/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { Subscription } from 'rxjs';
import { Obj } from '../api/types';
import { ChildContext, Service, ServiceIdentification } from './service-registry';

export type Context = {

  /**
   * Context id of the context as uuid v4
   */
  contextId: string,

  /**
   * Call a specific service
   *
   * @param service - the service identification of the specific service
   * @param method - method name to call
   * @param args - arguments for method service call
   * @param directCall - enables calling a service directly, even if callee does
   * not implement the service. This is needed for exposing api (e.g. ip
   * configuration) by a context
   *
   * @returns response if available
   */
  callService: (service: ServiceIdentification,
                method: string,
                args?: Array<unknown>,
                directCall?: boolean) => Promise<unknown>,

  /**
   * Deregister a specific service
   *
   * @param service - the service identification of the specific service
   */
  deregisterService: (service: ServiceIdentification) => Promise<void>,

  /**
   * Register a new child
   *
   * @param childSrcUrl - source url for the child
   */
  registerChildContext: (childSrcUrl: string, parentElement?: Node) => Promise<string>,

  /**
   * Deregister a child
   *
   * @param contextId - context id of the child
   */
  deregisterChildContext: (contextId: string) => Promise<void>,

  /**
   * Get all descendants of the context
   *
   * @returns context ids of the descendants
   */
  getDescendants: () => Array<string>,

  /**
   * Get all registered services
   *
   * @returns Service registry as Map<string, string>
   */
  getServiceRegistry: () => Map<string, string>

  /**
   * Get direct child of the context specified by childId
   *
   * {@link ChildContext | child context}
   */
  getChild: (childId: string) => ChildContext | undefined;

  /**
   * Overwrite css variables in the following way
   * - new css variables are added
   * - existing variables are overwritten with the new value if specified in the
   *   passed map or left as they are if not specified
   * - no variables are deleted
   *
   * @param cssVariables - Map of css variables
   * @param recursively - indicator if called recursively on each descendant
   */
  overwriteCssVariables(cssVariables: Map<string, string>, recursively?: boolean): void;

  /**
   * Publish a value to a topic - syntactic suggar for
   * context.callService({ serviceIdentification }, 'publish', topic, value);
   *
   * @param service - Service to publish on
   * @param topic - topic to publish on
   * @param value - value to publish on the topic
   */
  publish(service: Service | ServiceIdentification, topic: string, value: unknown): Promise<void>;

  /**
   * Susbcribe to topics - syntactic suggar for
   * context.callService({ serviceIdentification }, 'subscribe', [...topics]);
   *
   * @param service - Service to subscribe to
   * @param topics - optional Array of topics to subscribe to. If not set,
   * unsubscribes to all topics on service
   * @param callback - Callback that should be invoked on next at subscription
   *
   * @returns Subscription
   */
  subscribe(
    service: Service | ServiceIdentification,
    topics: Array<string>, callback: (next: unknown) => void): Promise<Subscription>

  /**
   * Unsubscribe from topics - syntactic suggar for
   * context.callService({ serviceIdentification }, 'unsubscribe', [...topics]);
   *
   * @param service - Service to subscribe to
   * @param topics - Array of topics to subscribe to
   */
  unsubscribe(service: ServiceIdentification, topics?: Array<string>): void;

  /**
   * Using the expose config api it is possible to configure all micro
   * frontends that have the same url.
   *
   * The Collage will merge config objects for specific MFs in order:
   * 1. an empty object
   * 2. the config object that matches the url
   * 3. the config object that matches the name
   * 4. the config properties on the dom element
   */
  receiveConfigFromParent(): Promise<Obj<unknown>>;
}
