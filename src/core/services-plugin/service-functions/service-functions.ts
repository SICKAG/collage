import merge from 'lodash.mergewith';
import plugin from '../../../lib/collage-plugin';
import log from '../../../lib/logging';
import {
  FrontendDescription, GenericPluginAPI, PluginFunctions, Services,
} from '../../../types';
import { EnhancedContext, InternalServicesApi, PreviousContext } from '../model';

/**
 * Manages the communication with a request response mechanism.
 * If several fragments will use the same service, the service implementation of the topmost arrangement will be used.
 *
 * Sequence Diagram: see {@link services.md}
 */

/**
 * Get the function of a nested service and return it. Otherwise return undefined.
 */
export function getNestedService(
  services: Services,
  servicePath: Array<string>,
  serviceName: string,
): Services | CallableFunction | undefined {
  if (!services) {
    return undefined;
  }
  if (servicePath.length === 0) {
    return services[serviceName] as CallableFunction;
  }
  const mutablePath = [...servicePath];
  const pathEntry = mutablePath.shift() as string;

  return getNestedService(services[pathEntry] as Services, mutablePath, serviceName);
}

/**
 * Workflow for handling calling a service
 */
async function callServiceWorkflow(
  { _plugins: { servicePlugin } }: EnhancedContext,
  ownServices: Services,
  service: string,
  nestedServicePath: string[],
  ...args: unknown[]
) {
  const fn = (x: unknown) => x as CallableFunction;
  // Check if called service is in branchServices
  if (getNestedService(servicePlugin.branchServices as Services, nestedServicePath, service)) {
    log('service-functions.ts', `service ${service} is in branch`);
    // execute callService of the arrangement
    // eslint-disable-next-line max-len
    return fn(servicePlugin.branchServices?.callService)(
      service,
      nestedServicePath,
      ...args,
    );
  }

  log('service-functions.ts', `service ${service} is NOT in branch`);
  const ownService = getNestedService(ownServices, nestedServicePath, service);
  // check if the called service is in ownServices
  if (ownService) {
    log('service-functions.ts', `service ${service} is in own services`);
    // execute service
    return fn(ownService)(...args);
  }
  throw new Error(`Service "${service}" is NOT part of defined services`);
}

/**
 * Creates a handler for a proxy.
 * If a method is called on `services` property, its checked if the called service is part of the own defined services.
 * If yes and the called service is flat like `services.foo`, the workflow for calling this service is triggered.
 * If the called service is a nested service like `services.foo.bar.bazz()`,
 * a new proxy is created, till the last element `bazz` is called
 * @param context - the context
 * @param ownServices - services, that are defined by this context
 * @param nestedServicePath - path, to store the entries of a nested service
 */
function handler(
  context: PreviousContext,
  ownServices: Services,
  nestedServicePath: Array<string>,
): ProxyHandler<Services> {
  return {
    get: (__: unknown, service: string) => {
      if (!getNestedService(ownServices, nestedServicePath, service)) {
        throw new Error(`Service "${service}" is NOT part of defined services`);
      }

      if (typeof getNestedService(ownServices, nestedServicePath, service) === 'object') {
        const path = [...nestedServicePath, service];
        // eslint-disable-next-line no-param-reassign
        nestedServicePath = [];
        return new Proxy({}, handler(context, ownServices, path));
      }

      return (...args: Array<unknown>) => callServiceWorkflow(
        context as EnhancedContext,
        ownServices,
        service,
        [...nestedServicePath],
        ...args,
      );
    },
  };
}

function createServicesProxy(context: PreviousContext, ownServices: Services) {
  return new Proxy(
    {},
    handler(context, ownServices, []),
  );
}

const servicePlugin: PluginFunctions<FrontendDescription, PreviousContext, EnhancedContext> = {
  enhanceExpose: ({ services }: FrontendDescription, context: PreviousContext) => {
    const ownServices = { ...services, ...context._plugins?.topicsPlugin as Record<string, unknown> } as Services;
    return {
      services: createServicesProxy(context, ownServices),
      _plugins: {
        servicePlugin: {
          callService:
            (service: string, nestedServicePath: Array<string>, ...args: Array<unknown>) => callServiceWorkflow(
              context as EnhancedContext,
              ownServices,
              service,
              nestedServicePath,
              ...args,
            ),
        },
      },
    } as EnhancedContext;
  },
  enhanceUpdateContext: () => { /** */ },
  enhanceExtractContextAsArrangement: (data: GenericPluginAPI) => {
    const services = merge(
      merge({}, data.description.services),
      (data.context._plugins as InternalServicesApi)?.servicePlugin.branchServices,
    );

    return {
      services: {
        ...services,
        callService: (data.context._plugins as InternalServicesApi).servicePlugin.callService,
      },
    };
  },
};
export default plugin<FrontendDescription, PreviousContext, EnhancedContext>(servicePlugin);
