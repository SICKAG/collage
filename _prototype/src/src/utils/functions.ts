/* eslint-disable max-len */
/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */
import { AsyncMethodReturns } from 'penpal/lib/types';
import { ChildApi } from 'src/model/childApi';
import {
  ChildContext, ChildContextMap, MethodType, ServiceIdentification, ServiceRegistry,
} from '../model/service-registry';

/**
 * Get the corresponding method type of the called service
 *
 * @param method - method name
 * @returns method type
 */
export const getMethodType = (method: string): MethodType => {
  if (method === MethodType.SUBSCRIBE) {
    return MethodType.SUBSCRIBE;
  } if (method === MethodType.PUBLISH) {
    return MethodType.PUBLISH;
  } if (method === MethodType.UNSUBSCRIBE) {
    return MethodType.UNSUBSCRIBE;
  }
  return MethodType.OTHER;
};

/**
 * Create a merged service registry with priority for own services before child
 * services (they were added first!).
 *
 * @param serviceRegistry - first part of the service registries to be merged
 * @param childServiceRegistry - second part of the service registries to be merged
 * @returns merged service registry containing all services from own context and all descendants
 */
export const mergeServiceRegistries = (serviceRegistry: ServiceRegistry, childServiceRegistry: ServiceRegistry): ServiceRegistry => {
  const mergedServiceRegistry: ServiceRegistry = new Map();
  childServiceRegistry.forEach((id, service) => {
    if (!serviceRegistry.has(service)) {
      mergedServiceRegistry.set(service, id);
    } else {
      mergedServiceRegistry.set(service, serviceRegistry.get(service) as string);
    }
  });

  // Add services of parent, which are not implemented by the child, to its own service registry. Otherwise if a grandchild, which is dynamically added, implements a service,
  // which is already implemented by the parent, but not the child, will newly be registered and not taken from parent service implementation
  serviceRegistry.forEach((id, serviceId) => {
    if (!mergedServiceRegistry.has(serviceId)) {
      mergedServiceRegistry.set(serviceId, id);
    }
  });

  return mergedServiceRegistry;
};

/**
 * Convert the childContextMap to a clonable object, so it can be send over postMessage
 *
 * @param childContextMap - Map containing all child contexts
 * @param contextId - contextId of the current context
 * @returns clonable childContextMap
 */
export const convertChildContextMapToClonable = (childContextMap: ChildContextMap, contextId: string): ChildContextMap => {
  const convertedChildContextMap: ChildContextMap = new Map();
  childContextMap.forEach((childContext: ChildContext, childContextId: string) => {
    convertedChildContextMap.set(childContextId, childContext.isDirectDescendant
      ? { isDirectDescendant: false, child: contextId }
      : childContext);
  });
  return convertedChildContextMap;
};

/**
 * Returns the child object to the corresponding context id
 *
 * @param childContextMap - Map containing all child contexts
 * @param childContextId - the context id of the child
 * @returns the child object
 */
export const getChildContextObject = (childContextMap: ChildContextMap, childContextId: string): AsyncMethodReturns<ChildApi> => {
  const childContext = childContextMap.get(childContextId);
  if (!childContext) {
    throw new Error(`could not find childContext for contextId: ${childContextId}`);
  }
  if (!childContext.isDirectDescendant) {
    return getChildContextObject(childContextMap, childContext.child as string);
  }
  return (childContext.child as AsyncMethodReturns<ChildApi>);
};

/**
 * Returns a promise after a specified timeout time
 *
 * @param timeout - time in ms
 * @returns the promise
 */
export const getTimeoutPromise = async (timeout: number): Promise<string> => new Promise((resolve) => {
  window.setTimeout(() => { resolve('timeout'); }, timeout);
});

/**
 * Create subscription id from service id, version and topic
 *
 * @param serviceIdent - service identification containing id and version
 * @param topic - topic of the subscription
 * @returns subscription id
 */
export const getSubscriptionId = (serviceIdent: ServiceIdentification, topic: string): string => `id:${serviceIdent.id},version:${serviceIdent.version},topic:${topic}`;

/**
 * Get service identification and topic from subscription id
 *
 * @param subscriptionId - subscription id
 * @returns object with service identification and topic
 */
export const getServiceIdentificationFromSubscriptionId = (subscriptionId: string): { serviceIdent: ServiceIdentification, topic: string } => {
  const indexTopic: number = subscriptionId.indexOf(',topic:');
  const serviceIdentification: ServiceIdentification = convertStringToServiceIdentification(subscriptionId.substring(0, indexTopic));
  const topic: string = subscriptionId.substring(indexTopic + 7);
  return { serviceIdent: serviceIdentification, topic };
};

/**
 * Converts a ServiceIdentification to a string
 *
 * @param serviceIdent - service identification to be converted
 */
export const convertServiceIdentificationToString = (serviceIdent: ServiceIdentification): string => `id:${serviceIdent.id},version:${serviceIdent.version}`;

/**
 * Get service identification from service identification string
 *
 * @param serviceStr - service identification as string
 * @returns service identification object
 */
export const convertStringToServiceIdentification = (serviceStr: string): ServiceIdentification => {
  const indexVersion: number = serviceStr.indexOf(',version:');
  return { id: serviceStr.substring(3, indexVersion), version: serviceStr.substring(indexVersion + 9) };
};

/**
 * Get all css variables set on the document
 *
 * @param doc - optional - document to read the css variables from
 * @returns A map of all css variables set on the document and their values
 */
export const getCssVariablesFromDocument = (doc: Document = document): Map<string, string> => {
  // create array of all stylesheets on this document which are not loaded from other origins
  const stylesheets = Array.from(doc.styleSheets).filter((sheet) => !sheet.href || sheet.href.startsWith(window.location.origin));

  // remove every entry which is not a css variable
  const cssRules = stylesheets.reduce(
    // eslint-disable-next-line no-return-assign
    (resultValue: Array<CSSRule>, currentValue) => [
      ...resultValue,
      ...Array.from(currentValue.cssRules),
    ],
    [], // eslint-disable-line indent
  );

  const rootCssRules = cssRules.filter((rule) => (rule as CSSStyleRule).selectorText === (':root'));

  let cssVariables: Array<string> = [];

  rootCssRules.forEach((rule) => {
    let { cssText } = rule;
    cssText = cssText.replace(':root', '');
    cssText = cssText.replace('{', '');
    cssText = cssText.replace('}', '');
    cssVariables = cssVariables.concat(cssText.split(';'));
  });

  const stylesMap = new Map();

  cssVariables.forEach((entry) => {
    const variable = entry.split(':');
    const key = variable[0].trim();
    const value = variable[1];
    stylesMap.set(key, value);
  });

  return stylesMap;
};
