import { InternalTopicsAPI } from '../topics-plugin/simple-topics/model';
import { Services } from '../../types';

/**
 * ServicesApi Type
 */
export type InternalServicesApi = {
  servicePlugin: {
    callService: (service: string, nestedServicePath: Array<string>, args: unknown) => Promise<unknown>,
    branchServices: Services
  }
}

export type PreviousContext = {
  _plugins?: {
    topicsPlugin?: InternalTopicsAPI,
  }
}

export type EnhancedContext = PreviousContext & {
  services: Services,
  _plugins: InternalServicesApi
}

// branchServices: Services;
// callService: (service: string, nestedServicePath: Array<string>, args: unknown) => Promise<unknown>,
