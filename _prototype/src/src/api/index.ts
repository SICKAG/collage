/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */

import { embedInContext } from '../elements/fragment';
import { createContext } from '../Context';
import { createSelfService, mapContextToApi, mapToServiceArray } from './mappings';
import { ContextApi, FrontendDescription } from './types';

/**
 * exposes a frontend application as a valid content within Collage
 *
 * @param descriptor - an object describing the Fragment / Arrangement
 * @returns - an initialized Collage context api object
 */
export default async function expose(descriptor: FrontendDescription = {}): Promise<ContextApi> {
  const serviceList = mapToServiceArray(descriptor.services);
  if (descriptor.functions) {
    serviceList.push(createSelfService(descriptor));
  }
  const context = await createContext(serviceList, descriptor.config);
  const namedChildren = await embedInContext(context);
  return mapContextToApi(context, namedChildren);
}
