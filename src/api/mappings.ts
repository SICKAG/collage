/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { Context } from '../model/context';
import { findContextAtName } from '../elements/fragment';
import { merge } from '../utils/transforms';
import { IncompleteService, ServiceIdentification } from '../model/service-registry';
import { convertStringToServiceIdentification } from '../utils/functions';
import {
  ContextApi, Obj, SelfServiceDescription, ServiceDescription,
  ServiceFunctions, ServiceMap, SubscribableService, TopicApi,
} from './types';

// TODO: is mapping still necessary?
/**
 * Map api conform api descriptions to 'old school' service array
 *
 * @param services - services object
 * @returns oldschool service array
 */
export function mapToServiceArray(services: ServiceMap = {}): Array<IncompleteService> {
  return Object.entries(services)
    .map(([name, service]) => ({
      id: name,
      version: '',
      impl: createServiceImpl(service),
      ...createSubscribable((service as SubscribableService).topics),
    }));
}

/**
 * create a service that describes the 'self' object of a Fragment
 *
 * @param _ - named parameter object
 * @param _.functions - functions the frontend exposes directly
 * @param _.topics - topics to subscribe to
 * @returns - a service description without an id (id will be set via context)
 */
export function createSelfService({ functions }: SelfServiceDescription)
  : IncompleteService {
  return {
    id: null,
    version: '',
    async impl(method: string, args: Array<unknown>) {
      return functions && functions[method](...args);
    },
  };
}

/**
 * Maps an oldschool context to the new api
 *
 * @param context - the oldschool context object
 * @param children - all children that should be refered to by name
 * @returns a complete api context object
 */
export async function mapContextToApi(context: Context, children: Array<string>)
  : Promise<ContextApi> {
  function topicController(service: ServiceIdentification): TopicApi {
    return new Proxy({}, {
      get(_, topic) {
        return {
          async publish(message: unknown) {
            await context.publish(service, topic as string, message);
          },
          async subscribe(receiver: (next: unknown) => void) {
            await context.subscribe(service, [topic as string], receiver);
          },
          async unsubscribe() {
            await context.unsubscribe(service, [topic as string]);
          },
        };
      },
    });
  }

  function mapServices<T>(serviceMapper: (x: ServiceIdentification) => Obj<T>): Obj<T> {
    return Array.from(context.getServiceRegistry().keys())
      .map(convertStringToServiceIdentification)
      .map(serviceMapper)
      .reduce(merge, {});
  }

  return {
    services: mapServices(mapFrom(context).toServiceCaller),
    topics: mapServices((service) => ({ [service.id]: topicController(service) })),
    children: children
      .map(mapFrom(context).toChildCaller)
      .reduce(merge, {}),
    config: await context.receiveConfigFromParent(),
    id: context.contextId,
  };
}

function createServiceImpl(apiService: ServiceDescription) {
  function shouldIgnorePubSubMethod(method: string) {
    return (typeof apiService === 'object')
           && apiService.topics?.length
           && ['publish', 'subscribe'].includes(method)
           && !(apiService as ServiceFunctions)[method];
  }

  return async function impl(method: string, args: Array<unknown>) {
    return shouldIgnorePubSubMethod(method) || (method
      ? (apiService as ServiceFunctions)[method]
      : (apiService as CallableFunction))(args);
  };
}

function createSubscribable(topics?: Array<string>) {
  return {
    subscriptionTopics: topics,
    isSubscribable: !!topics?.length,
  };
}

type ServiceProxy = {call: CallableFunction, service: ServiceIdentification}

function createServiceCallProxy({ call, service }: ServiceProxy) {
  const callable = (method?: unknown) => (
    async (...args: Array<unknown>) => call(service, method || '', args)
  );
  return new Proxy(callable(), {
    get(_target, method) {
      return callable(method);
    },
  });
}

function createChildCallProxy({ call, name }: {call: CallableFunction, name: string}) {
  return new Proxy({}, {
    get(_, method) {
      return (...args: Array<unknown>) => call(findChildService(name), method || '', args);
    },
  });
}

function findChildService(name: string) {
  const contextId = findContextAtName(name);
  return (contextId && {
    id: contextId,
    version: '',
  }) as ServiceIdentification;
}

function mapFrom(context: Context) {
  return {
    toServiceCaller(service: ServiceIdentification) {
      return {
        [service.id]: createServiceCallProxy({ call: context.callService, service }),
      };
    },
    toChildCaller(name: string) {
      return {
        [name]: createChildCallProxy({ call: context.callService, name }),
      };
    },
  };
}
