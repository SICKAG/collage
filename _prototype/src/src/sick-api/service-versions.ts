/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import {
  createObject, merge, transform, valueIs, when,
} from '../utils/transforms';
import { ContextApi, ServiceDescription, ServiceMap } from '../api/types';
import {
  Expose, SICKFrontendDescription, SICKServiceDescription, VersionedService,
} from './types';

function idToString({ id, version }: { id: string, version: string }): string {
  return `###${id}###${version}`;
}

function isVersioned(service: SICKServiceDescription): boolean {
  return !!service.versions;
}

function expandVersions(name: string, { versions = {} }: VersionedService):
  Array<[string, ServiceDescription]> {
  return Object.entries(versions)
    .map(([version, service]) => ([idToString({ id: name, version }), service]));
}

/**
 * Creates unique service names from different version of the same service.
 * This enables us to treat service versions as distinct services oin the core
 * while still distinguishing between them in the expanded api later.
 *
 * Exampe:
 * ```javascript
 * prepareVersionedServices({
 *  services: {
 *    foo: fooService,
 *    bar: {
 *      versions: {
 *        ['1.0']: barServiceOne,
 *        ['2.0']: barServiceTwo
 *      }
 *    }
 *  }
 * })
 * ```
 * will return:
 * ```javascript
 * {
 *   foo: fooService,
 *   '###bar###1.0###': barServiceOne,
 *   '###bar###2.0###': barServiceTwo
 * }
 * ```
 *
 * @param x - incomming frontend description
 * @param x.services - services description
 * @returns a service map with versions expqaned as unique service names
 */
function prepareVersionedServices({ services }: SICKFrontendDescription): ServiceMap {
  return transform(services)
    .flatMap(when(valueIs(isVersioned))
      .then(([field, value]) => expandVersions(field, value))
      .else((entry) => [entry]))
    .reduce(...createObject()) as ServiceMap;
}

/**
 * creates an extended services api that is able to map service version access
 * to the real services behind this versions.
 *
 * Example:
 * ```javascript
 * createServiceVersionsApi({
 *  services: {
 *    foo: fooService,
 *    bar: {
 *      versions: {
 *        ['1.0']: barServiceOne,
 *        ['2.0']: barServiceTwo
 *      }
 *    }
 *  },
 *  servicesApi: {
 *   foo: Proxy(fooService),
 *   '###bar###1.0###': Proxy(barServiceOne),
 *   '###bar###2.0###': Proxy(barServiceTwo)
 *  }
 * })
 * ```
 *
 * will return:
 * ```javascript
 * {
 *   foo: Proxy(fooService),
 *   bar: {
 *     '1.0': Proxy(barServiceOne),
 *     '2.0': Proxy(barServiceTwo)
 *   }
 * }
 * ```
 *
 * @param x - .
 * @param x.services - the service descriptions as they are given to expose
 * @param x.servicesApi - the services api from the result of core-expose
 * @returns the extended api
 */
function createServiceVersionsApi(
  { services = {}, servicesApi }:
    {
      services?: Record<string, SICKServiceDescription>,
      servicesApi: Record<string, ServiceDescription>
    },
): Record<string, ServiceDescription> {
  return transform(services)
    .map(when(valueIs(isVersioned))
      .then(([name, { versions = {} }]) => [
        name,
        transform(versions)
          .map(([version]) => [version, idToString({ id: name, version })])
          .map(([version, idString]) => ({ [version]: servicesApi[idString] }))
          .reduce(merge, {}),
      ])
      .else(([name]) => [name, servicesApi[name]]))
    .reduce(...createObject()) as Record<string, ServiceDescription>;
}

/**
 * SICK specific additions to the core functionality
 *
 * TODO: try to enhance readability of map-reduce
 *
 * Currently this includes:
 * - service versions
 *
 * @param expose - the Collage expose function to enhance
 */
export default function versioned(expose: Expose) {
  return async function versionedExpose(descriptor: SICKFrontendDescription): Promise<ContextApi> {
    const coreApi = await expose({
      ...descriptor,
      services: prepareVersionedServices(descriptor),
    });

    return {
      ...coreApi,
      services: createServiceVersionsApi({
        services: descriptor.services,
        servicesApi: coreApi.services,
      }),
    };
  };
}
