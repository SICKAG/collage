/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable no-return-await */
/* eslint-disable no-param-reassign */
/* eslint-disable no-lonely-if */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-fallthrough */
/* eslint-disable no-plusplus */
/* eslint-disable no-case-declarations */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable consistent-return */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-promise-executor-return */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/extensions */
/* eslint-disable max-len */
/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { connectToChild, connectToParent } from 'penpal';
import {
  AsyncMethodReturns, Connection, Methods,
} from 'penpal/lib/types.js';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  Service,
  TransactionObject,
  ServiceIdentification,
  MethodType,
  ServiceRegistry,
  ChildContextMap,
  SubscriptionMap,
  topicError,
  ChildContext,
  IncompleteService,
} from './model/service-registry.js';
import uuidv4 from './utils/uuid.js';
import {
  convertChildContextMapToClonable,
  convertServiceIdentificationToString,
  convertStringToServiceIdentification,
  getChildContextObject,
  getMethodType,
  getServiceIdentificationFromSubscriptionId,
  getSubscriptionId,
  getTimeoutPromise,
  mergeServiceRegistries,
  getCssVariablesFromDocument,
} from './utils/functions.js';
import { Context as Ctx } from './model/context.js';
import { elementName as embedElementName } from './elements/fragment-element.js';
import { findChildIdentity } from './elements/fragment.js';
import { ConfigDescriptor } from './api/types.js';
import { ParentApi } from './model/parentApi.js';
import { ChildApi } from './model/childApi.js';

export { Observable };

/**
 * haz I parent?
 *
 * @returns I has parent!
 */
export function hasParent(): boolean {
  try {
    return !!(window.parent !== window && (
      window.parent.document.getElementById('davinci-mfo-container')
      || window.parent.document.getElementsByTagName(embedElementName).length)); // i am running in a karma test context
  } catch {
    return window.parent !== window;
  }
}

/* eslint-disable no-console */
class Context implements Ctx {
  private readonly _contextId = uuidv4();

  get contextId() {
    return this._contextId;
  }

  private _hasParent(): boolean {
    return hasParent();
  }

  /**
   * A map with the information which service is registered at which context
   */
  private _serviceRegistry: ServiceRegistry = new Map(); // Map of <serviceID: string, contextId: string>

  /**
   * callbackMap holds the own implementations of all services of a context. The callbacks remain in the map, even if the implementations
   * of a different context are used for fallback purpose.
   */
  private _callbackMap: Map<string, (method: string, args?: Array<unknown>) => unknown> = new Map();// Map of <serviceId: string, callback: unknown>

  /**
   * childContextMap contains all contexts which are children or decendants of this context
   */
  private _childContextMap: ChildContextMap = new Map(); // Map of <contextId: string, children: ChildContext --> iframes

  /**
   * If a service not registered at this context is called, a callback for resolving and rejecting is stored in the transactionResolveMap. The resolving callback is
   * called, when the value gets returned from the other context. The rejecting callback is called, if an error was thrown. (@see callService())
   */
  private _transactionResolveMap: Map<string, { resolve: (value: unknown) => void, reject?: (value: unknown) => void }> = new Map(); // Map of <transactionId: string, { resolve: resolveCallback (value:unknown) => void, reject: rejectCallback(value: unknown) => void} >

  /**
   * Parent Context
   */
  private _parent: AsyncMethodReturns<ParentApi> | null = null;

  private _cssVariablesMap: Map<string, string> | null = null;

  // const TRANSACTION_RESOLUTION_TIMEOUT = 250;

  // Find a reasonable time for a connection timeout. This timeout lets the tests run slower the higher it is.
  readonly CONNECTION_TIMEOUT = 3000;

  readonly HTTP_ERROR_CODE = 300; // all http status codes >= 300 are error codes

  private _subscriptionCallbackMap: Map<string, Array<TransactionObject>> = new Map(); // Map of <subscriptionId: string, callback: array>

  private _subscriptionMap: SubscriptionMap = new Map();

  private _config: ConfigDescriptor;

  /**
   * Penpal parent connection
   */
  private _parentConnection: Connection<ParentApi> | null = null;

  // Callback, that should be resolved, when parent is done with initializing (registering services and children)
  private _initDoneResolvingCallback: ((value: unknown) => void) | null = null;

  /**
   * Constructor
   *
   * @param services - provided services
   * @param config - config initialization object
   */
  constructor(services: Array<IncompleteService>, config: ConfigDescriptor) {
    // first register own services
    this._registerOwnServices(services);

    this._config = config;

    // only do this if we have a parent
    if (this._hasParent()) {
      // Methods the child is exposing to the parent
      const childMethods: Methods = {
        //  get current services of child
        getServices: () => [...this._serviceRegistry.keys()],

        // update services of child
        setServices: (serviceRegistrySnippet: Map<string, string>) => this._updateServiceRegistries(serviceRegistrySnippet),

        // overwrite css variables to allow theming
        overwriteCssVariables: (cssVariables: Map<string, string>, recursively?: boolean) => this.overwriteCssVariables(cssVariables, recursively),

        // get context id of child
        getContextId: () => this.contextId,

        // call a service directly on a specific context
        callServiceDirectly: (callObject: { service: ServiceIdentification, method: string, args: [] }) => {
          this.callService({ id: callObject.service.id, version: callObject.service.version }, callObject.method, callObject.args);
        },

        // call a specific service of child
        callServiceWithBackchannel: (callObject: { transactionObject: TransactionObject, service: ServiceIdentification, method: string, args: Array<unknown> }) => {
          this._callServiceWithBackchannel(callObject.transactionObject, { id: callObject.service.id, version: callObject.service.version }, callObject.method, callObject.args);
        },

        // respond a potential return value to the parent or child context, if not using service from own callback map
        respondToServiceCall: async (callObject: { transactionObject: TransactionObject, returnValueObject: unknown }) => this._respondToServiceCall(callObject.transactionObject, callObject.returnValueObject),

        // Redirect the new, published value of a topic to the corresponding observable of the child context
        publishValueOnObservable: (transactionObject: TransactionObject, service: ServiceIdentification, returnValue: unknown) => {
          this._publishValueOnObservable(transactionObject, service, returnValue);
        },

        // Remove subscriber from subscribers callback map
        removeFromSubscriptionCallbackMap: (transactionObject: TransactionObject, service: ServiceIdentification) => {
          this._removeFromSubscriptionCallbackMap(transactionObject, service);
        },

        // Remove transaction from transaction resolve map
        removeFromTransactionResolveMap: (transactionObject: TransactionObject) => {
          this._removeFromTransactionResolveMap(transactionObject);
        },

        // Check if descendant with context id has a service implementation for a specific service
        hasServiceImplementation: async (serviceIdent: ServiceIdentification, contextId: string) => this._hasServiceImplementation(serviceIdent, contextId),

        // Disconnect from parent
        disconnect: () => {
          this._disconnectFromParent();
        },

        // Get descendants
        getDescendants: () => this.getDescendants(),

        // Get subscriptions of a descendant with context id
        getSubscriptions: async (contextId: string) => this._getSubscriptions(contextId),

        // Get subscription callback map of a descendant with context id
        getSubscriptionCallbackMap: async (contextId: string) => this._getSubscriptionCallbackMap(contextId),

        // Update subscribersCallbackMap of a child with context id
        updateSubscribersCallbackMap: (subscribersCallbackSnippet: Map<string, Array<TransactionObject>>, contextId: string) => {
          this._updateSubscribersCallbackMap(subscribersCallbackSnippet, contextId);
        },

        //  Resolves callback, when parent is done with initialization (registering services and children)
        initDone: () => {
          if (this._initDoneResolvingCallback) {
            this._initDoneResolvingCallback('');
          } else {
            console.error('initDoneResolvingCallback could not be called');
          }
        },
      };

      let timeout = this.CONNECTION_TIMEOUT;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        timeout = (window.parent as any).karma ? 250 : this.CONNECTION_TIMEOUT;// use a very low timeout when running in a karma test context
      } catch (e) {
        // we can only do the karma thing, if we are on the same origin. Otherwise we will get an CORS exception, if we integrate other origins and do this check
      }

      this._parentConnection = connectToParent({ timeout, methods: childMethods });
      this._parentConnection.promise.then(async (connectedParent: AsyncMethodReturns<ParentApi>) => {
        this._parent = connectedParent;
        // fetch css variables from parent for style synchronization
        this._parent.getCssVariables().then((value: Map<string, string>) => {
          this.overwriteCssVariables(value, false);
        });
      }).catch((error) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // console.log((window.parent as any).karma);
        console.error(`Parent ${window.parent.location.href} could not connect to child ${window.location.href}. ${error}`);
        // ConnectionTimeout Error is thrown from penpal if the parent didn`t respond in the specified timeout time
        // Disconnects all messaging channels
        this._parentConnection?.destroy();
        // callback needs to be resolved if no connection could be established
        // e.g. karma embeds tests in iframe, which are detected as "parent" from this library. The library can`t establish a connection to them and therefore
        // ends up in this catch block
        if (this._initDoneResolvingCallback) {
          this._initDoneResolvingCallback('');
        }
      });
    } else {
      this._cssVariablesMap = getCssVariablesFromDocument();
    }
  }

  /**
   * Initializing connection. If the Fragment has an Arrangement, it waits until the parent has finished with its initialization before continuing.
   */
  initializeConnection = async (): Promise<unknown> => {
    // only do this if we have a parent
    // note: when testing, we get in this if block, because karma embeds its tests in iframes. Therefore this promise needs to be resolved at some point
    if (this._hasParent()) {
      const connectionCompletePromise = new Promise((resolve) => {
        this._initDoneResolvingCallback = resolve;
      });
      return connectionCompletePromise;
    }
    return Promise.resolve();
  }

  async receiveConfigFromParent() {
    return await this._parent?.getConfig(this._contextId) || {};
  }

  /**
   * Register a child context and perform handshake
   *
   * @param childSrcUrl - source url for the context
   * @param parentElement - the element to create the iframe in
   */
  // async function registerChildContext(childSrcUrl: string): Promise<string> {
  registerChildContext = async (childSrcUrl: string, parentElement?: Node): Promise<string> => {
    // timeout promise, so in case of the connection to child or parent is lost, at some point the request is cancelled
    const timeoutPromise = getTimeoutPromise(this.CONNECTION_TIMEOUT);
    // eslint-disable-next-line no-async-promise-executor
    const registerPromise = new Promise<string>(async (resolve, reject) => {
      // TODO: Is it secure to do a 'HEAD' request with 'no-cors' mode? Or can we expect, that the cors configuration of the servers are right (Access-Control-Allow-Origin,...), so we won`t get cors errors?
      // Check for the availability of the src before appending the iframe, so if the source is not available or
      // there are no access rights, the registration won`t go on and stops immediately
      try {
        const response = await fetch(childSrcUrl, { method: 'HEAD', mode: 'no-cors' });
        if (response.status >= this.HTTP_ERROR_CODE) {
          return reject(`Source ${childSrcUrl} not available`);
        }
      } catch (error) {
        return reject(`Source ${childSrcUrl} not available`);
      }

      // TODO: What to do, if the Fragment has an X-Frame-Options "SameOrigin" or "deny"? Do we need to specify, that if someone
      // wants to do a DAVINCI-MF, the X-Frame-options can only be set to allow-from (so the frame or another MF can embed it)? The Baseline Security Requirements recommend
      // using the X-Frame-Options! https://mosaicplus.sick.com/display/wsSDLTools/BSR10%3A2019+-+Web (no. 1.4)
      const iframe: HTMLIFrameElement = document.createElement('iframe');
      iframe.src = childSrcUrl;
      iframe.classList.add('responsive-iframe');

      const container = parentElement || document.getElementById('davinci-mfo-container'); // FIXME: check if we still need davinci-mfo-container
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      container!.appendChild(iframe);

      // Methods the parent is exposing to child
      const parentMethods: Methods = {
        // call a service of parent
        callServiceWithBackchannel: (data: { transactionObject: TransactionObject, service: Service, method: string, args: Array<unknown> }) => {
          this._callServiceWithBackchannel(data.transactionObject, data.service, data.method, data.args);
        },
        // return response of a service to parent context for further handling
        respondToServiceCall: (data: { transactionObject: TransactionObject, returnValueObject: unknown }) => {
          this._respondToServiceCall(data.transactionObject, data.returnValueObject);
        },
        // register new child contexts to parent
        registerChildContext: async (childContextId: string, childDescendantMap: ChildContextMap, updatedServiceRegistry: Map<string, string>) => {
          // parent services need to have priority (its services were added first!)
          const mergedServiceRegistry = mergeServiceRegistries(this._serviceRegistry, updatedServiceRegistry);

          // register new services to own service registry and all other children
          this._updateServiceRegistries(mergedServiceRegistry, childContextId);

          // update own childContextMap with updated childContextMap of direct child
          this._updateChildContextMap(childDescendantMap);

          if (this._parent) {
            const updatedChildContext: ChildContextMap = convertChildContextMapToClonable(this._childContextMap, this.contextId);
            await this._parent.registerChildContext(childContextId, updatedChildContext, this._serviceRegistry);
          }
        },
        // Redirect the new, published value of a topic to the corresponding observable of the parent context
        publishValueOnObservable: (transactionObject: TransactionObject, service: ServiceIdentification, returnValue: unknown) => {
          this._publishValueOnObservable(transactionObject, service, returnValue);
        },
        // Remove subscriber from subscribers callback map
        removeFromSubscriptionCallbackMap: (transactionObject: TransactionObject, service: ServiceIdentification) => {
          this._removeFromSubscriptionCallbackMap(transactionObject, service);
        },
        // Remove transaction from transaction resolve map
        removeFromTransactionResolveMap: (transactionObject: TransactionObject) => {
          this._removeFromTransactionResolveMap(transactionObject);
        },
        // Unregister the service implementations from the deregistered ids and exchange them with others
        deregisterServices: async (services: Array<ServiceIdentification>, deregisteredIds: Array<string>, force = false) => {
          await this._deregisterServicesInternal(services, deregisteredIds, force);
        },
        // Deregister children of child context map from parent
        deregisterFromChildContextMap: async (deregisteredIds: Array<string>) => {
          this._deregisterFromChildContextMap(deregisteredIds);
        },
        // Update subscribersCallbackMap of parent
        updateSubscribersCallbackMap: (subscribersCallbackSnippet: Map<string, Array<TransactionObject>>, contextId: string) => {
          this._updateSubscribersCallbackMap(subscribersCallbackSnippet, contextId);
        },
        // Get css variables map for style synchronization
        getCssVariables: () => {
          if (document.querySelector('#davinci-mfo-container')) {
            return this._cssVariablesMap;
          }
          return new Map();
        },
        getConfig: (childId: string) => {
          const getConfigByKey = (key?: unknown) => (key ? this._config[`${key}`] : {});

          const { name, url, config } = findChildIdentity(childId);

          return {
            ...getConfigByKey(url),
            ...getConfigByKey(name),
            ...config,
          };
        },
      };
      const connection = connectToChild<ChildApi>({ iframe, timeout: this.CONNECTION_TIMEOUT, methods: parentMethods });
      // Wait for onload event of iframe. Otherwise the order, in which the child urls are put in will not be respected
      const cbFunction = () => {
        iframe.removeEventListener('load', cbFunction);
        this._createConnectionToChild(connection, iframe).then(() => {
          resolve('registered');
        }).catch(() => {
          // Disconnects all messaging channels
          connection.destroy();
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          container!.removeChild(iframe);
          reject('registration unsuccessful');
        });
      };
      iframe.addEventListener('load', cbFunction);
    });

    return Promise.race([timeoutPromise, registerPromise]);
  }

  /**
   * Deregister a child context
   *
   * @param contextId - context id of the child to be deregistered
   */
  deregisterChildContext = async (contextId: string): Promise<void> =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      // Check if child is available
      if (!this._childContextMap || !this._childContextMap.has(contextId)) {
        return reject('Invalid child id.');
      }

      if (!this._childContextMap.get(contextId)?.isDirectDescendant) {
        return reject('Child is no direct descendant. Only direct descendants can be deregistered.');
      }

      const iframe = this._childContextMap.get(contextId)?.iframe; // FIXME: we need to fetch the iframe at this position before the child context is removed from the child context map and we don't have a reference at it anymore

      // Get all context ids from the child, which should be deregistered, and its descendants
      const deregisteredIds = [contextId];
      const descendants = await getChildContextObject(this._childContextMap, contextId).getDescendants();
      deregisteredIds.push(...descendants);

      // Get all services from which the service implementations of this child or its descendants are used
      const deregisterServices: Array<ServiceIdentification> = [];
      this._serviceRegistry.forEach((usedContextId, service) => {
        if (deregisteredIds.includes(usedContextId)) {
          const serviceIdent: ServiceIdentification = convertStringToServiceIdentification(service);
          deregisterServices.push(serviceIdent);
        }
      });

      // Deregister all service implementations from the deregistered ids and reregister with another service implementation (if available)
      await this._deregisterServicesInternal(deregisterServices, deregisteredIds, true);

      // Check for available subscriptions
      const updatedSubscribersCallbackMap = new Map<string, Map<string, Array<TransactionObject>>>();
      for (const deregisteredId of deregisteredIds) {
        const child = getChildContextObject(this._childContextMap, deregisteredId);

        // Remove subscriptions in subscriptionCallbackMaps
        const subscriptions: Array<string> = await child.getSubscriptions(deregisteredId);
        for (const subscription of subscriptions) {
          const { serviceIdent, topic } = getServiceIdentificationFromSubscriptionId(subscription);
          const transactionObject: TransactionObject = {
            inquirerContextId: deregisteredId, transactionId: '', type: MethodType.UNSUBSCRIBE, topic,
          };
          this._removeFromSubscriptionCallbackMap(transactionObject, serviceIdent);
        }

        // Check if there are subscriptions in the subscriptionCallbackMap of children, which are getting deregistered and reregister them (if available)
        const subscriptionCallbackMap = await child.getSubscriptionCallbackMap(deregisteredId);
        for (const [subscriptionId, subscribersArray] of subscriptionCallbackMap as Map<string, Array<TransactionObject>>) {
          const { serviceIdent } = getServiceIdentificationFromSubscriptionId(subscriptionId);
          const serviceIdentStr = convertServiceIdentificationToString(serviceIdent);

          // Remove subscriptions of deregistered descendants
          const updatedSubscribersArray = subscribersArray.filter((s) => !deregisteredIds.includes(s.inquirerContextId));

          // only update subscription callback map for the subscription, if someone else has the service implementation
          if (this._serviceRegistry.has(serviceIdentStr)) {
            const newContextId = this._serviceRegistry.get(serviceIdentStr);
            if (newContextId && updatedSubscribersCallbackMap.has(newContextId)) {
              updatedSubscribersCallbackMap.get(newContextId)?.set(subscriptionId, updatedSubscribersArray);
            } else if (newContextId) {
              const subscription = new Map<string, Array<TransactionObject>>().set(subscriptionId, updatedSubscribersArray);
              updatedSubscribersCallbackMap.set(newContextId, subscription);
            } else {
              // TODO: handle newContextId === undefined error
            }
          }
        }
      }

      updatedSubscribersCallbackMap.forEach((subscriberCallbackMapSnippet, newContext) => {
        this._updateSubscribersCallbackMap(subscriberCallbackMapSnippet, newContext);
      });

      // Remove penpal connections
      // TODO: is destroying the connection to parent enough? because penpal seems to take care of destroying the connection, when the iframe is removed from dom (checks every 60 secs)
      // otherwise we would need to have a map with all penpal child connections...
      getChildContextObject(this._childContextMap, contextId).disconnect();

      // Deregister from all child context maps
      await this._deregisterFromChildContextMap(deregisteredIds);

      // Remove iframe with Fragment from dom
      iframe?.remove();
      resolve();
    })

  /**
   * Destroys penpal connection of all children (that are getting deregistered) to parent
   */
  private _disconnectFromParent = () => {
    this._parentConnection?.destroy();
    this._childContextMap.forEach((childContext, _childId) => {
      if (childContext.isDirectDescendant) {
        (childContext.child as AsyncMethodReturns<ChildApi>).disconnect();
      }
    });
  }

  /**
   * Remove specific contexts from all child context maps of ancestors
   *
   * @param deregisteredIds - context ids of the children, that should be removed
   */
  private _deregisterFromChildContextMap = async (deregisteredIds: Array<string>) => {
    for (const deregisteredId of deregisteredIds) {
      this._childContextMap.delete(deregisteredId);
      if (this._parent) {
        await this._parent.deregisterFromChildContextMap(deregisteredIds);
      }
    }
  }

  /**
   * Get all descendants of the context
   *
   * @returns context ids of the descendants
   */
  getDescendants = (): Array<string> => [...this._childContextMap.keys()]

  getChild = (id: string): ChildContext | undefined => this._childContextMap.get(id)

  /**
   * Get service registry
   */
  getServiceRegistry = (): ServiceRegistry => this._serviceRegistry

  /**
   * Publish a value to a topic - syntactic suggar for context.callService({ serviceIdentification }, 'publish', topic, value);
   *
   * @param service - Service to publish on
   * @param topic - topic to publish on
   * @param value - value to publish on the topic
   */
  publish = async (service: Service | ServiceIdentification, topic: string, value: unknown): Promise<void> => {
    const serviceId: ServiceIdentification = { id: service.id, version: service.version }; // ensure, that call service is callable correctly
    this.callService(serviceId, 'publish', [topic, value]);
  }

  /**
   * Susbcribe to topics - syntactic suggar for context.callService({ serviceIdentification }, 'subscribe', [...topics]);
   *
   * @param service - Service to subscribe to
   * @param topics - Array of topics to subscribe to
   * @param callback - Callback that should be invoked on next at subscription
   *
   * @returns Subscription
   */
  subscribe = async (service: Service | ServiceIdentification, topics: Array<string>, callback: (next: unknown) => void): Promise<Subscription> => {
    const serviceId: ServiceIdentification = { id: service.id, version: service.version }; // ensure, that call service is callable correctly
    const observable = await this.callService(serviceId, 'subscribe', topics);
    const subscription = (observable as Observable<unknown>).subscribe(callback);

    return subscription;
  }

  /**
   * Unsubscribe from topics - syntactic suggar for context.callService({ serviceIdentification }, 'unsubscribe', [...topics]);
   *
   * @param service - Service to subscribe to
   * @param topics - Array of topics to subscribe to
   */
  unsubscribe = async (service: Service | ServiceIdentification, topics?: Array<string>) => {
    const serviceId: ServiceIdentification = { id: service.id, version: service.version }; // ensure, that call service is callable correctly

    // TODO: implement context.unsubscribe(service) without topic array to unsubscribe from all topics at once
    if (!topics) {
      console.error('unsubscribing from all topics at once not implemented yet - please specify an array of topics to unsubscribe');
    }

    await this.callService(serviceId, 'unsubscribe', topics);
  }

  /**
   * Call specific service depending on registered route (self or parent)
   *
   * @param service - the service identification of the specific service
   * @param method - method name to call
   * @param args - arguments for method service call
   */
  callService = async (service: Service | ServiceIdentification, method: string, args?: Array<unknown>): Promise<unknown> => {
    const serviceId: ServiceIdentification = { id: service.id, version: service.version };
    const serviceIdentification = convertServiceIdentificationToString(serviceId);
    const methodType: MethodType = getMethodType(method);

    if (!this._serviceRegistry.has(serviceIdentification)) {
      throw new Error(`Service ${serviceIdentification} is not part of service registry`);
    }

    // Check if a service is called, which is implemented by ourself
    if (!this._callbackMap.has(serviceIdentification)
      && !this.getChild(serviceId.id)?.isDirectDescendant) {
      throw new Error('It is not possible to call a service, that is not implemented by yourself');
    }

    const contextAtWhichServiceIsRegistered = this._serviceRegistry.get(serviceIdentification);

    const transactionId = uuidv4();
    const transactionObject: TransactionObject = { inquirerContextId: this.contextId, transactionId, type: methodType };

    // Pub sub unsub method
    if (methodType !== MethodType.OTHER) {
      if (!args || !args[0]) {
        throw new Error('No method name specified');
      }
      transactionObject.topic = args[0] as string;

      if (methodType === MethodType.PUBLISH) {
        if (!args || !args[1]) {
          throw new Error('No value to publish specified');
        }
        transactionObject.publishValue = args[1] as string;
      }
    }

    if (contextAtWhichServiceIsRegistered === this.contextId) { // service is registered at our own context return immediately
      if (!this._callbackMap.has(serviceIdentification)) { // service might be lazyloaded
        // TODO: Implement solution for backchanneling return values of lazy loaded services
        console.warn('not able to return values from lazy loaded services at the moment');
      }

      const callback = this._callbackMap.get(serviceIdentification);
      if (!callback) {
        throw new Error(`Internal Error: No callback found for service: ${serviceIdentification}`);
      }

      const subscriptionId = getSubscriptionId(serviceId, transactionObject.topic as string);

      switch (methodType) {
        case MethodType.PUBLISH:
          const transactionObjects = this._subscriptionCallbackMap.get(subscriptionId);
          if (transactionObjects) {
            for (let i = 0; i < transactionObjects.length; i++) {
              this._publishValueOnObservable(transactionObjects[i], serviceId, transactionObject.publishValue);
            }
          }

          // add subscription to Subscription Map if not already present
          if (this._subscriptionMap.get(subscriptionId)) {
            this._subscriptionMap.get(subscriptionId)?.next(transactionObject.publishValue);
          } else if (args && args[0]) {
            let observable: BehaviorSubject<unknown> = new BehaviorSubject(transactionObject.publishValue);
            const subscriptionId = getSubscriptionId(service, args[0] as string);
            observable = this._addObservableToSubscriptionMap(subscriptionId, observable, transactionObject.transactionId);
            observable.subscribe();
          }
          return callback(method, args);
        case MethodType.SUBSCRIBE:
          if (args && args[0]) {
            await callback(method, args);
            let observable: BehaviorSubject<unknown> = new BehaviorSubject('initial value');
            observable = this._addObservableToSubscriptionMap(subscriptionId, observable, transactionObject.transactionId);
            return observable.asObservable();
          }
          // TODO: handle error

        case MethodType.UNSUBSCRIBE:
          if (args && args[0]) {
            this._removeSubscription(getSubscriptionId(serviceId, args[0] as string));
            return callback(method, args);
          }
          // TODO: handle error

        case MethodType.OTHER:
          return callback(method, args);
        default:
          return callback(method, args);
      }
    } else { // service is not registered at our own context
      let promiseResolvingCallback: ((value: unknown) => void) | null = null;
      let promiseRejectingCallback: ((value: unknown) => void) | null = null;

      const callServiceCompletePromise = new Promise((resolve, reject) => {
        promiseResolvingCallback = resolve;
        promiseRejectingCallback = reject;
      });

      // timeout promise, so in case of the connection to child or parent is lost, at some point the request is cancelled
      // const timeoutPromise = new Promise(resolve =>
      //   window.setTimeout(() => {
      //     // Cleanup: remove the transaction object from transactionResolveMap
      //     transactionResolveMap.delete(transactionId);
      //     resolve('timeout');
      //   }, TRANSACTION_RESOLUTION_TIMEOUT)
      // );

      if (promiseResolvingCallback && promiseRejectingCallback) {
        this._transactionResolveMap.set(transactionId, { resolve: promiseResolvingCallback, reject: promiseRejectingCallback });
      } else {
        throw new Error('error on setting reject and resolve callbacks in the transactionResolveMap');
      }

      this._callServiceWithBackchannel(transactionObject, serviceId, method, args);

      if (methodType === MethodType.SUBSCRIBE) {
        if (!args || !args[0]) {
          throw new Error('illegal subscription -- no topic was provided');
        } else {
          const currentSubscriptionValue = await callServiceCompletePromise;
          let observable: BehaviorSubject<unknown> = new BehaviorSubject(currentSubscriptionValue);

          const subscriptionCallback = (value: string) => {
            if (value !== `subscribed ${args[0]}`) { // we have to ignore the initial return value from the subscribe implementation
              observable.next(value);
            }
          };

          //
          this._transactionResolveMap.set(transactionObject.transactionId, { resolve: subscriptionCallback, reject: () => { throw new Error('rejected subscription callback'); } });

          const subscriptionId = getSubscriptionId(serviceId, args[0] as string);
          // add observable to own observable map
          observable = this._addObservableToSubscriptionMap(subscriptionId, observable, transactionObject.transactionId);
          return observable.asObservable();
        }
      } else if (methodType === MethodType.UNSUBSCRIBE) {
        if (!args || !args[0]) {
          // TODO: handle error -- Unsubscribe without topic
        } else {
          const subscriptionId = getSubscriptionId(serviceId, args[0] as string);
          this._removeSubscription(subscriptionId);
        }
      }

      return callServiceCompletePromise;
    }
  }

  /**
   * Unregister a specific service
   *
   * @param service - the service identification of the specific service
   */
  deregisterService = async (service: ServiceIdentification): Promise<void> => {
    const serviceIdentification = convertServiceIdentificationToString(service);

    // Check if service is available
    if (!this._serviceRegistry.has(serviceIdentification)) {
      return Promise.reject('Service is not part of service registry');
    }

    // Check if our own implementation is used
    const deregisterContextId = this._serviceRegistry.get(serviceIdentification);
    if (deregisterContextId !== this.contextId) {
      return Promise.reject('Another service implementation is used instead of the own');
    }

    await this._deregisterServicesInternal([service], [deregisterContextId]);

    // Check if there are subscriptions in the subscriptionCallbackMap, which are getting deregistered and reregister them (if available)
    for (const [subscriptionId, subscribersArray] of this._subscriptionCallbackMap) {
      const { serviceIdent, topic } = getServiceIdentificationFromSubscriptionId(subscriptionId);
      const serviceIdentStr = convertServiceIdentificationToString(serviceIdent);
      if (serviceIdentStr === serviceIdentification) {
        // only update subscription callback map for the subscription, if someone else has the service implementation
        if (this._serviceRegistry.has(serviceIdentStr)) {
          // Create transaction resolve object
          const transactionId = uuidv4();
          const transactionObject: TransactionObject = {
            inquirerContextId: deregisterContextId, transactionId, type: MethodType.SUBSCRIBE, topic,
          };
          const observable = this._subscriptionMap.get(subscriptionId);
          const newContextId = this._serviceRegistry.get(serviceIdentStr);
          if (!observable || !newContextId) {
            // TODO: handle error
          } else {
            const callback = (value: string) => { observable.next(value); };
            this._transactionResolveMap.set(transactionObject.transactionId, { resolve: callback });
            const subscription = new Map<string, Array<TransactionObject>>();
            subscribersArray.push(transactionObject);
            subscription.set(subscriptionId, subscribersArray);
            await this._updateSubscribersCallbackMap(subscription, newContextId);
            this._subscriptionCallbackMap.delete(subscriptionId);
          }
        }
      }
    }
  }

  /**
   * Unregister a specific service
   *
   * @param services - array of service identifications, that should be deregistered
   * @param deregisterContextIds - array of context ids from children, that the services should be deregistered for
   * @param force - flag, indicating if a deregistration should be done, even if there is no other service implementation from someone else available
   */
  private _deregisterServicesInternal = async (services: Array<ServiceIdentification>, deregisterContextIds: Array<string>, force = false): Promise<void> => new Promise(async (resolve, reject) => { // eslint-disable-line no-async-promise-executor
    // Tell parent to deregister service implementations for the deregistered context ids and reregister with another service implementation

    if (this._parent) {
      try {
        await this._parent.deregisterServices(services, deregisterContextIds, force);
        resolve();
      } catch (error) {
        reject(error);
      }
    } else {
      // we are the highest parent, so we need to handle the deregistration and reregistration
      const serviceRegistrySnippet: Map<string, string> = new Map();

      for (const service of services) {
        let newUsedContextId = '';
        for (const [childContextId, _childContext] of this._childContextMap) {
          const child = getChildContextObject(this._childContextMap, childContextId);
          const hasServiceImplementation = await child.hasServiceImplementation(service, childContextId);
          if (hasServiceImplementation && !deregisterContextIds.includes(childContextId)) {
            newUsedContextId = childContextId;
            break;
          }
        }
        if (!newUsedContextId && !force) {
          return reject('No other service implementation available');
        }

        // Exchange the deregistered service implementation with the new one
        const serviceIdentification = convertServiceIdentificationToString(service);
        if (newUsedContextId) {
          serviceRegistrySnippet.set(serviceIdentification, newUsedContextId);
        }
      }
      this._serviceRegistry.forEach((contextId, serviceId) => {
        const serviceIdent = convertStringToServiceIdentification(serviceId);
        const isIncluded = services.findIndex((s) => s.id === serviceIdent.id && s.version === serviceIdent.version) >= 0;
        if (!isIncluded) {
          serviceRegistrySnippet.set(serviceId, contextId);
        }
      });
      await this._updateServiceRegistries(serviceRegistrySnippet);
      resolve();
    }
  })

  /**
   * Register services to service registry and create callback map
   *
   * @param services - provided services
   */
  private _registerOwnServices = (services: Array<IncompleteService>) => {
    services.forEach((serviceDescription) => {
      const service = serviceDescription.id ? serviceDescription as Service : {
        ...serviceDescription,
        id: this._contextId,
      };

      let impl = null;

      if (service.isSubscribable) {
        impl = async (method: string, args: Array<unknown>) => {
          const subscriptionId = getSubscriptionId(service, args[0] as string);
          if (method === MethodType.SUBSCRIBE) {
            if (!service.subscriptionTopics || service.subscriptionTopics.indexOf(args[0] as string) === -1) {
              throw new Error(topicError + args[0]);
            }
            // Execute implementation, if something is done by the service itself when subscribing
            await service.impl(method, args);
            return `subscribed ${args[0]}`;
          } if (method === MethodType.PUBLISH) {
            if (!service.subscriptionTopics || service.subscriptionTopics.indexOf(args[0] as string) === -1) {
              throw new Error(topicError + args[0]);
            }
            // Execute implementation, if something is done by the service itself when publishing
            await service.impl(method, args);
            if (this._subscriptionMap.has(subscriptionId)) {
              const observable = this._subscriptionMap.get(subscriptionId);
              if (!observable) {
                throw new Error(`Internal error: cannot get subscription Observable for ${subscriptionId}`);
              }
              if (observable.closed || !observable.observed) {
                this._subscriptionMap.delete(subscriptionId);
                return;
              }
            }
            this._subscriptionMap.get(subscriptionId)?.next(args[1]);
            return `published ${args[1]}`;
          } if (method === MethodType.UNSUBSCRIBE) {
            if (!service.subscriptionTopics || service.subscriptionTopics.indexOf(args[0] as string) === -1) {
              throw new Error(topicError + args[0]);
            }
            // Execute implementation, if something is done by the service itself when unsubscribing
            await service.impl(method, args);
            return `unsubscribed ${args[0]}`;
          }
          return service.impl(method, args);
        };
      } else {
        impl = service.impl;
      }

      this._callbackMap.set(`id:${service.id},version:${service.version}`, impl);
      this._serviceRegistry.set(`id:${service.id},version:${service.version}`, this.contextId);
    });
  }

  /**
   * Update the service registry of the current context and all of its children
   *
   * @param serviceRegistrySnippet - updated service registry
   * @param ignoredContextId - contextId of child, which should not be updated
   */
  private _updateServiceRegistries = (serviceRegistrySnippet: Map<string, string>, ignoredContextId?: string) => {
    // update own service registry
    this._serviceRegistry = serviceRegistrySnippet;
    // update service registry of children
    this._childContextMap.forEach(async (childContext, contextId) => {
      if ((!ignoredContextId || contextId !== ignoredContextId) && childContext.isDirectDescendant) {
        // update service registry of direct child
        await (childContext.child as AsyncMethodReturns<ChildApi>).setServices(serviceRegistrySnippet);
      }
    });
  }

  /**
   * Overwrite css variables in the following way
   * - new css variables are added
   * - existing variables are overwritten with the new value if specified in the passed map or left as they are if not specified
   * - no variables are deleted
   *
   * @param cssVariables - Map of css variables
   * @param recursively - indicator if called recursively on each descendant
   */
  overwriteCssVariables(cssVariables: Map<string, string>, recursively?: boolean) {
    cssVariables?.forEach(((value: string, key: string) => {
      if (key.trim().startsWith('--')) {
        document.documentElement.style.setProperty(key, value);
      }
    }));

    if (recursively === undefined || recursively === true) {
      this.getDescendants().forEach((childContextId) => {
        getChildContextObject(this._childContextMap, childContextId).overwriteCssVariables(cssVariables, true);
      });
    }

    this._cssVariablesMap = cssVariables;
  }

  /**
   * Update the subscribers callback map of the specific context with id
   *
   * @param subscribersCallbackSnippet - updated subscribers callback map
   * @param contextId - id of the context, which should be updated
   */
  private _updateSubscribersCallbackMap = async (subscribersCallbackSnippet: Map<string, Array<TransactionObject>>, contextId: string) => {
    // subscriptionCallbackMap is updated at this context
    if (contextId === this.contextId) {
      // Remove own subscriptions from subscriptionCallbackMap and transactionResolveMap
      const newSubscribersCallbackMap = new Map<string, Array<TransactionObject>>();
      subscribersCallbackSnippet.forEach((transactionObjs, subscriptionId) => {
        for (const transactionObj of transactionObjs) {
          if (transactionObj.inquirerContextId === this.contextId) {
            this._transactionResolveMap.delete(transactionObj.transactionId);
          } else {
            newSubscribersCallbackMap.has(subscriptionId)
              ? newSubscribersCallbackMap.get(subscriptionId)?.push(transactionObj)
              : newSubscribersCallbackMap.set(subscriptionId, [transactionObj]);
          }
        }
      });
      this._subscriptionCallbackMap = new Map([...this._subscriptionCallbackMap, ...newSubscribersCallbackMap]);
    } else {
      // subscriptionCallbackMap needs to be updated at a descendant
      if (this._childContextMap.has(contextId)) {
        const child = getChildContextObject(this._childContextMap, contextId);
        await child.updateSubscribersCallbackMap(subscribersCallbackSnippet, contextId);
      } else {
        // subscriptionCallbackMap needs to be updated somewhere else
        await this._parent?.updateSubscribersCallbackMap(subscribersCallbackSnippet, contextId);
      }
    }
  }

  private _createConnectionToChild = async (connection: Connection<ChildApi>, iframe: HTMLIFrameElement): Promise<string> => new Promise((resolve, reject) => {
    connection.promise.then(async (child: AsyncMethodReturns<ChildApi>) => {
      // get services from child
      const childServices = await child.getServices();
      const childContextId = await child.getContextId();

      // add child services to service registry of parent
      const serviceRegistrySnippet = this._notifyChildServicesToParent(childServices, childContextId);
      // update service registry of child
      await child.setServices(serviceRegistrySnippet);
      this._childContextMap.set(childContextId, { child, iframe, isDirectDescendant: true });

      if (this._parent) {
        const convertedChildContextMap: ChildContextMap = convertChildContextMapToClonable(this._childContextMap, this.contextId);
        await this._parent.registerChildContext(this.contextId, convertedChildContextMap, this._serviceRegistry);
      }

      // resolve connection callback from child
      await child.initDone();
      iframe.name = childContextId;

      resolve('connection successful');
    }).catch(() => {
      // ConnectionTimeout Error is thrown from penpal if the child didn`t respond in the specified timeout time
      console.warn(`Child ${iframe.src} could not connect to parent ${window.location.href}. Timed out after ${this.CONNECTION_TIMEOUT}ms.`);

      // callback needs to be resolved if no connection could be established
      if (this._initDoneResolvingCallback) {
        this._initDoneResolvingCallback('');
      }

      reject('timeout');
    });
  })

  /**
   * Call specific service of a child or parent context with a back channel, so the return value of a service is transmitted
   *
   * @param transactionObject - object with information about inquirer context and transaction id
   * @param service - the service identification of the specific service
   * @param method - method name to call
   * @param args - arguments for method service call
   */
  private _callServiceWithBackchannel = async (transactionObject: TransactionObject, service: ServiceIdentification, method: string, args?: Array<unknown>) => {
    const serviceIdentification = convertServiceIdentificationToString(service);
    if (this._serviceRegistry.has(serviceIdentification)) {
      const contextAtWhichServiceIsRegistered = this._serviceRegistry.get(serviceIdentification);

      // service is registered at this context
      if (contextAtWhichServiceIsRegistered === this.contextId) {
        if (!this._callbackMap.has(serviceIdentification)) { // service might be lazyloaded
          // TODO: Implement solution for backchanneling return values of lazy loaded services
          console.warn('not able to return values from lazy loaded services at the moment');
        }

        const callback = this._callbackMap.get(serviceIdentification);
        if (!callback) {
          throw new Error(`Internal error, no callback set in callbackMap for ${serviceIdentification}`);
        }

        switch (transactionObject.type) {
          case MethodType.SUBSCRIBE:
            // Check if context already subscribed to the topic. If yes, don`t allow multiple subscriptions and clean up all maps!
            const subscriptionId = getSubscriptionId(service, transactionObject.topic as string);
            if (this._subscriptionCallbackMap.has(subscriptionId)) {
              const isAlreadySubscribed: boolean = this._subscriptionCallbackMap.get(subscriptionId)?.some((to: TransactionObject) => to.inquirerContextId === transactionObject.inquirerContextId) ?? false;
              if (!isAlreadySubscribed) {
                this._subscriptionCallbackMap.get(subscriptionId)?.push(transactionObject);
              }
              this._subscriptionMap.get(subscriptionId)?.subscribe((value) => {
                this._respondToServiceCall(transactionObject, value).catch((error) => {
                  console.error(error);
                }); // return the value of the callback
              });
            } else {
              this._subscriptionCallbackMap.set(subscriptionId, [transactionObject]);
              this._subscriptionMap.get(subscriptionId)?.subscribe((value) => {
                this._respondToServiceCall(transactionObject, value).catch((error) => {
                  console.error(error);
                }); // return the value of the callback
              });
            }
            break;
          case MethodType.PUBLISH:
            const transactionObjects = this._subscriptionCallbackMap.get(getSubscriptionId(service, transactionObject.topic as string));
            if (transactionObjects) {
              for (let i = 0; i < transactionObjects.length; i++) {
                this._publishValueOnObservable(transactionObjects[i], service, transactionObject.publishValue);
              }
            }
            break;
          case MethodType.UNSUBSCRIBE:
            this._removeFromSubscriptionCallbackMap(transactionObject, service);
            break;
          default:
            break;
        }

        let returnValue;
        try {
          returnValue = await callback(method, args);
        } catch (e) {
          returnValue = e;
        }
        this._respondToServiceCall(transactionObject, returnValue).catch((error) => {
          console.error(error);
        }); // return the value of the callback
      } else { // service is not registered this context
        if (this._childContextMap.has(contextAtWhichServiceIsRegistered as string)) { // service is registered at one of our descendants
          const child = getChildContextObject(this._childContextMap, contextAtWhichServiceIsRegistered as string);
          await child.callServiceWithBackchannel({
            transactionObject, service, method, args,
          });
        } else {
          // service is registered at our parent
          await this._parent?.callServiceWithBackchannel({
            transactionObject, service, method, args,
          });
        }
      }
    } else {
      console.error('error');
    }
  }

  /**
   * Get all subscriptions of a specific descendant
   *
   * @param contextId - id of the child
   * @returns array of all own subscriptions
   */
  private _getSubscriptions = async (contextId: string): Promise<Array<string>> => {
    if (contextId === this.contextId) {
      return [...this._subscriptionMap.keys()];
    }
    if (this._childContextMap.has(contextId)) {
      const child = getChildContextObject(this._childContextMap, contextId);
      return await child.getSubscriptions(contextId);
    }
    return Promise.reject(`${contextId} is not a descendant of ${this.contextId}`);
  }

  /**
   * Get subscription callback map of a specific descendant
   *
   * @param contextId - id of the child
   * @returns subscription callback map
   */
  private _getSubscriptionCallbackMap = async (contextId: string): Promise<Map<string, Array<TransactionObject>>> => {
    if (contextId === this.contextId) {
      return new Map(this._subscriptionCallbackMap);
    }
    if (this._childContextMap.has(contextId)) {
      const child = getChildContextObject(this._childContextMap, contextId);
      return await child.getSubscriptionCallbackMap(contextId);
    }
    return Promise.reject(`${contextId} is not a descendant of ${this.contextId}`);
  }

  /**
   * Check if a specific descendant has a service implementation for a specific service
   *
   *
   * @param serviceIdent - the specific service
   * @param contextId - id of the child
   * @returns Flag, indicating if the context has a service implementation
   */
  private _hasServiceImplementation = async (serviceIdent: ServiceIdentification, contextId: string): Promise<boolean> => {
    const serviceIdentStr = convertServiceIdentificationToString(serviceIdent);
    if (contextId === this.contextId) {
      return this._callbackMap.has(serviceIdentStr);
    }
    if (this._childContextMap.has(contextId)) {
      const child = getChildContextObject(this._childContextMap, contextId);
      return await child.hasServiceImplementation(serviceIdent, contextId);
    }
    return Promise.reject(`${contextId} is not a descendant of ${this.contextId}`);
  }

  /** Redirect a new, published value of a topic to the corresponding observable
   *
   * @param transactionObject - the transaction object
   * @param service - service identification
   * @param returnValue - the new, published value of a topic
   */
  private _publishValueOnObservable = (transactionObject: TransactionObject, service: ServiceIdentification, returnValue: unknown) => {
    // own context
    if (this._transactionResolveMap.has(transactionObject.transactionId)) {
      // check for observable if it was unsubscribed and remove it, if it is
      const subscriptionId = getSubscriptionId(service, transactionObject.topic as string);
      if (this._subscriptionMap.has(subscriptionId)) {
        const observable = this._subscriptionMap.get(subscriptionId);
        if (!observable) {
          throw new Error(`Internal error: cannot get subscription Observable for ${subscriptionId}`);
        }
        if (observable.closed || !observable.observed) {
          this._subscriptionMap.delete(subscriptionId);
          this._transactionResolveMap.delete(transactionObject.transactionId);
          this._removeFromSubscriptionCallbackMap(transactionObject, service);
          return;
        }
      }
      this._transactionResolveMap.get(transactionObject.transactionId)?.resolve(returnValue);
    } else {
      // at one of our descendants
      if (this._childContextMap.has(transactionObject.inquirerContextId)) {
        getChildContextObject(this._childContextMap, transactionObject.inquirerContextId).publishValueOnObservable(transactionObject, service, returnValue);
      } else {
        // at one of our ancestors or their descendants
        this._parent?.publishValueOnObservable(transactionObject, service, returnValue);
      }
    }
  }

  /**
   * Remove subscriber from subscription callback map
   *
   * @param transactionObject - the subscription object
   * @param service - service identification
   */
  private _removeFromSubscriptionCallbackMap = (transactionObject: TransactionObject, service: ServiceIdentification) => {
    const serviceIdentification = convertServiceIdentificationToString(service);
    const contextAtWhichServiceIsRegistered = this._serviceRegistry.get(serviceIdentification);
    const subscriptionId = getSubscriptionId(service, transactionObject.topic as string);
    // service is registered at this context
    if (contextAtWhichServiceIsRegistered === this.contextId) {
      if (this._subscriptionCallbackMap.has(subscriptionId)) {
        const transactionObjects = this._subscriptionCallbackMap.get(subscriptionId);
        const subscribeTransactionObject = transactionObjects?.find((to: TransactionObject) => (to.inquirerContextId === transactionObject.inquirerContextId && to.topic === transactionObject.topic));
        if (!subscribeTransactionObject) {
          // TODO: handle error
        } else {
          this._removeFromTransactionResolveMap(subscribeTransactionObject);
        }
        const updatedSubscribers = transactionObjects?.filter((to: TransactionObject) => !(to.inquirerContextId === transactionObject.inquirerContextId && to.topic === transactionObject.topic));
        // check if there are any subscribers left. If not, delete whole subscription entry of this topic
        updatedSubscribers?.length === 0
          ? this._subscriptionCallbackMap.delete(subscriptionId)
          : this._subscriptionCallbackMap.set(subscriptionId, updatedSubscribers as Array<TransactionObject>);
      }
    } else if (this._childContextMap.has(contextAtWhichServiceIsRegistered as string)) { // service is registered at one of our descendants
      const child = getChildContextObject(this._childContextMap, contextAtWhichServiceIsRegistered as string);
      child.removeFromSubscriptionCallbackMap(transactionObject, service);
    } else {
      // service is registered at our parent
      this._parent?.removeFromSubscriptionCallbackMap(transactionObject, service);
    }
  }

  /**
   * Remove subscription from subscription map
   *
   * @param subscriptionId - subscription id containing service id, version and topic
   */
  private _removeSubscription = (subscriptionId: string) => {
    if (this._subscriptionMap.has(subscriptionId)) {
      const observable = this._subscriptionMap.get(subscriptionId);
      if (!observable) {
        throw new Error(`Internal error: cannot get subscription Observable for ${subscriptionId}`);
      }
      observable.unsubscribe();
      this._subscriptionMap.delete(subscriptionId);
    }
  }

  /**
   * Remove transaction callback from transaction resolve map for the corresponding transaction object
   *
   * @param transactionObject - the transaction object
   */
  private _removeFromTransactionResolveMap = (transactionObject: TransactionObject) => {
    if (transactionObject.inquirerContextId === this.contextId) {
      this._transactionResolveMap.delete(transactionObject.transactionId);
    } else if (this._childContextMap.has(transactionObject.inquirerContextId)) { // service is registered at one of our descendants
      const child = getChildContextObject(this._childContextMap, transactionObject.inquirerContextId);
      child.removeFromTransactionResolveMap(transactionObject);
    } else {
      // service is registered at our parent
      this._parent?.removeFromTransactionResolveMap(transactionObject);
    }
  }

  /**
   * Responds recursively to a service call to transport a return value to its inquiring context
   *
   * @param transactionObject - object with information about inquirer context and transaction id
   * @param returnValueObject - return value. Has to be from supported type of structured clone algorithm: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
   */
  private _respondToServiceCall = async (transactionObject: TransactionObject, returnValueObject: unknown) => {
    if (transactionObject.inquirerContextId === this.contextId) {
      // we are in the inquirer context and can return the value now
      try {
        this._handleServiceResponse(transactionObject, returnValueObject);
      } catch (error) {
        console.error(error);
      }
    } else if (this._childContextMap.has(transactionObject.inquirerContextId)) {
      // the inquirer context is a child from this context. Call respondToServiceCall at child context
      const child = getChildContextObject(this._childContextMap, transactionObject.inquirerContextId);
      await child.respondToServiceCall({ transactionObject, returnValueObject });
    } else {
      // the inquirer context is a parent of this context. Call respondToServiceCall at parent context
      await this._parent?.respondToServiceCall({ transactionObject, returnValueObject });
    }
  }

  /**
   * Add child services to parent service registry and its descendants
   *
   * @param childServices - array with the service Ids of the child services to be added to the service registries of the contexts in the mesh
   * @param childContextId - Id of the context providing the services
   * @returns Map<string, string> - serviceRegistrySnippet containing all services and contextIds for the services, the context requires
   */
  private _notifyChildServicesToParent = (childServices: Array<string>, childContextId: string): Map<string, string> => {
    const serviceRegistrySnippet: Map<string, string> = new Map();
    try {
      childServices.forEach((service) => {
        if (!this._serviceRegistry.has(service)) {
          serviceRegistrySnippet.set(service, childContextId);
        } else {
          serviceRegistrySnippet.set(service, this._serviceRegistry.get(service) as string);
        }
      });

      // Add services of parent, which are not implemented by the child, to its own service registry. Otherwise if a grandchild, which is dynamically added, implements a service,
      // which is already implemented by the parent, but not the child, will newly be registered and not taken from parent service implementation
      this._serviceRegistry.forEach((_contextId, serviceId) => {
        if (!serviceRegistrySnippet.has(serviceId)) {
          serviceRegistrySnippet.set(serviceId, this._serviceRegistry.get(serviceId) as string);
        }
      });

      // Update services of parent and all its children with the added services
      this._updateServiceRegistries(serviceRegistrySnippet, childContextId);
    } catch (error) {
      console.log(error);
    }
    return serviceRegistrySnippet;
  }

  /**
   * Update own child context map with the updated one from the direct child
   *
   * @param updatedChildContextMap - updated child context map from the direct child
   */
  private _updateChildContextMap = (updatedChildContextMap: ChildContextMap) => {
    updatedChildContextMap.forEach((childContext, childId) => {
      if (!this._childContextMap.has(childId)) {
        this._childContextMap.set(childId, childContext);
      }
    });
  }

  /**
   * Handles the service response for the inquirer context, by triggering the resolve of the related promise
   *
   * @param transactionObject - object with information about inquirer context and transaction id
   * @param returnValueObject - return value. Has to be from supported type of structured clone algorithm: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
   *
   * @throws Error when no promiseResolvingCallback or promiseRejectingCallback could be found in the transactionResolveMap
   */
  private _handleServiceResponse = (transactionObject: TransactionObject, returnValueObject: unknown) => {
    const promiseResolvingCallback = this._transactionResolveMap.get(transactionObject.transactionId)?.resolve;
    const promiseRejectingCallback = this._transactionResolveMap.get(transactionObject.transactionId)?.reject;

    // Cleanup: remove the transaction object from transactionResolveMap
    if (transactionObject.type !== MethodType.SUBSCRIBE || (transactionObject.type === MethodType.SUBSCRIBE && String(returnValueObject).startsWith('Error:'))) {
      this._transactionResolveMap.delete(transactionObject.transactionId);
    }

    if (!promiseResolvingCallback) {
      throw new Error('Internal error: no promiseResolvingCallback set');
    }

    if (!promiseRejectingCallback) {
      throw new Error('Internal error: no promiseRejectingCallback set');
    }

    if (String(returnValueObject).startsWith('Error:')) {
      promiseRejectingCallback(returnValueObject);
    } else {
      promiseResolvingCallback(returnValueObject);
    }
  }

  /**
   * Add a new subscription of the context for a specific topic
   *
   * @param subscriptionId - subscription id containing service id, service version and topic
   * @param observable - a new observable for the subscription
   * @param transactionId - id of the context, where the subscription came from
   * @returns the new created observable if no subscription was done before with the topic or the already available observable
   */
  private _addObservableToSubscriptionMap = (subscriptionId: string, observable: BehaviorSubject<unknown>, transactionId: string): BehaviorSubject<unknown> => {
    // Check if context already subscribed to the topic. If yes, don`t allow multiple subscriptions and clean up the transactionResolve map!
    if (this._subscriptionMap.has(subscriptionId)) {
      observable = this._subscriptionMap.get(subscriptionId) as BehaviorSubject<unknown>;
      this._transactionResolveMap.delete(transactionId);
    } else {
      this._subscriptionMap.set(subscriptionId, observable);
    }
    return observable;
  }
}

/**
 * Create context and wait for initialization of connection
 *
 * @param services - provided services
 * @param config - initialization config for children
 */
export const createContext = async (services: Array<IncompleteService>, config: ConfigDescriptor = {}): Promise<Context> => {
  const context = new Context(services, config);

  // Wait for all services to be registered from and to parent before connection is completed from child
  await context.initializeConnection();
  return context;
};

/**
 * Initializes a context as Fragment with its services and child Fragments. After initialization
 * inter-Fragment frontend communication and service sharing is possible.
 *
 * @param services - all services a Fragment implements
 * @param childSrcUrls - the children of a Fragment
 * @returns the context of a Fragment
 */
export const expose = async (services: Array<Service>, childSrcUrls: Array<string>): Promise<Ctx> => {
  const context: Ctx = await createContext(services);
  // create handshake for all children (iframes)
  for (let childIndex = 0; childIndex < childSrcUrls.length; childIndex++) {
    try {
      await context.registerChildContext(childSrcUrls[childIndex]);
    } catch (err) {
      console.warn(err);
    }
  }
  return context;
};
