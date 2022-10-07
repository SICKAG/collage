import { Methods } from 'penpal/lib/types';
import { FrontendDescription, Functions, GenericPluginAPI } from '../../types';
import log from '../../lib/logging';
import { extractContextAsArrangement, extractFragmentDescription, extractContextAsFragment } from '../index';

// TODO: Write JSDoc

export function initiateData(data: { description: FrontendDescription, context: unknown }) {
  log('handshake-data.ts', data, {});
  return data;
}

/**
 * Extracts the important information from a context, needed by a fragment from its arrangement
 *
 * @params data -
 */
// FIXME: This should be part of The Service Plugin
export function extractAsArrangement(data: { description: FrontendDescription, context: unknown}) {
  log('handshake-data.ts', 'extractContextAsArrangement', data, {});
  return extractContextAsArrangement(data as unknown as GenericPluginAPI) as Methods;
}

/**
 * Extracts the functions from a penpal parent, needed by a fragment from its arrangement
 */
export function extractArrangementFromPenpalParent(data: FrontendDescription) {
  log('handshake-data.ts', 'extractArrangementFromPenpalParent', data, {});
  return { ...data };
}

/**
 * Extracts important information from a context, needed by an arrangement from its fragment
 */
export function extractAsFragment(data: {
    description: FrontendDescription,
    context: {functions: Functions},
    callback: CallableFunction,
  }) {
  log('handshake-data.ts', 'extractContextAsFragment', data, {});
  return extractContextAsFragment(data as unknown as GenericPluginAPI) as Methods;
}

/**
 * Extracts the functions from a penpal child, needed by an arrangement from its fragment
 *
 * @params frameId - id of the fragment
 * @params functions - child functions
 */
export function extractFragmentDescriptionFromPenpalChild(data: {
  frameId: string,
  functions: Functions,
}) {
  log('handshake-data.ts', 'extractFragmentContextFromChild', data, {});
  return extractFragmentDescription(data as unknown as GenericPluginAPI);
}

// TODO: Write tests!
