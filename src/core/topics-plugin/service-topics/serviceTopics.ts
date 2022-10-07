import mergeWith from 'lodash.mergewith';
import plugin from '../../../lib/collage-plugin';
import {
  FrontendDescription, PluginFunctions, Services,
} from '../../../types';
import { SimpleTopicsAPI } from '../index';

/**
 * Manages the communication with a publish subscribe mechanism where topics can be defined at dev-time in services
 *
 * Sequence Diagram: see {@link topics.md}
 */

 type PreviousContext = {
  topics: SimpleTopicsAPI
}

type EnhancedContext = {
  topics: SimpleTopicsAPI & Record<string, unknown>;
}

/**
 * Creates a nested Object from a dot-separated-string by interpreting every substring as a level of the object
 * @param str - string to convert, e.g. 'level_0.level_1.level_2'
 * @param tail - content of the most deepest level, e.g. 'i am deepest'
 * @returns nested Object, e.g. { level_0: { level_1: { level_2: 'i am deepest' }}}
 */
export function stringToObject(str: string, tail = {}): object {
  return str.split('.').reduceRight((acc, currentValue) => ({ [currentValue]: acc }), tail);
}

/**
 * Searches for arrays with a specific name at any position in an object and returns their entries as a single array
 * The entries are prepended by their object paths
 * @param obj - Object to be browsed
 * @param arrayName - name of the Array of interest
 * @param path - path variable to prepend
 * @returns combined Array of entries
 */
export function extractEntriesFromObject(
  obj: Record<string, unknown>,
  arrayName: string,
  path: Array<string> = [],
): Array<string> {
  const keys = Object.keys(obj);
  let combinedArray: Array<string> = [];
  keys.forEach((key: string) => {
    const value = obj[key];
    if (key === arrayName && Array.isArray(value)) {
      const arrayOfInterest = value.map((val) => path.join('.').concat('.', val));
      combinedArray = [...combinedArray, ...arrayOfInterest];
    } else if (typeof value === 'object') {
      path.push(key);
      combinedArray = [
        ...combinedArray,
        ...extractEntriesFromObject(value as Record<string, unknown>, arrayName, path),
      ];
      path.pop();
    }
  });
  return combinedArray;
}

/**
 * Creates a Topics Object, which uses the Contexts topicsApi, to extend the Context with
 * @param topicsArray - array of topics
 * @param context - Context
 * @returns Topics Object
 */
export function arrayToTopicsObject(topicsArray: Array<string>, simpleTopicsApi: SimpleTopicsAPI): object {
  const topicsObject = {};
  const topicsApi = (topic: string) => ({
    publish: (message: unknown) => simpleTopicsApi.publish(topic, message),
    subscribe: (callback: (message: unknown) => unknown) => simpleTopicsApi.subscribe(topic, callback),
  });

  topicsArray.forEach((entry) => {
    mergeWith(topicsObject, stringToObject(entry, topicsApi(`superToken-${entry}`)));
  });
  return topicsObject;
}

/**
 * Extracts all topics from the definition and appends them to the Context and connect topicsApi
 * @param services - services which may contain topics
 * @param context - context with topicsApi
 * @returns topicsObject
 */
function extractTopics(services: Services, simpleTopicsApi: SimpleTopicsAPI) {
  if (!services) {
    return {};
  }
  const topcisArray = extractEntriesFromObject(services, 'topics');
  const topicsObject = arrayToTopicsObject(topcisArray, simpleTopicsApi);
  return topicsObject;
}

const topicsStage2Plugin: PluginFunctions<FrontendDescription, PreviousContext, EnhancedContext> = {
  enhanceExpose: (description: FrontendDescription, context: PreviousContext) => {
    const services = description.services as Services;
    return {
      topics: {
        ...context.topics,
        ...extractTopics(services, context.topics),
      },
    } as EnhancedContext;
  },
};

export default plugin<FrontendDescription, PreviousContext, EnhancedContext>(topicsStage2Plugin);
