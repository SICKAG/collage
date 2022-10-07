import merge from 'lodash.mergewith';
import {
  Collage, Plugin, PluginFunctions,
} from '../types';

/**
 * D, E, P refer to
 *
 * Description, Expected and Provided and are used here for better readability
 */

export function mergeContexts(context: unknown, append: unknown) {
  merge(context, append, (c, a) => {
    if (!c) {
      return a;
    }
    if (!a) {
      return c;
    }
    if (typeof c === 'object' && typeof a === 'object') {
      if (!Object.entries(c).length) {
        return a;
      }
      if (!Object.entries(a).length) {
        return c;
      }
    }
    return undefined;
  });
}

// TODO: Find out if we can unify the buildContext etc functions

function buildContext<D, C, E>(
  previous: (description: D) => C | Promise<C>, // "collage function"
  pluginFunction: (description: D, context: C) => Promise<E> | E | void,
) {
  return async (description: D) => {
    const context = await previous(description);
    const append = await pluginFunction((description || {}) as D, context);
    mergeContexts(context as unknown as C, append as unknown as C);
    return context as unknown as E;
  };
}

function enhanceUpdateContextBlubb<C, E>(
  previous: (context: C) => C | Promise<C>, // "collage Function"
  pluginFunction: (context: C) => Promise<E> | E | void,
) {
  return async (context: E) => {
    const previousContext = await previous(context as unknown as C);
    const append = await pluginFunction(previousContext);
    mergeContexts(context, append as E);
    return context as unknown as E;
  };
}

function extractPluginSpecificProperties<C, E>(
  previous: (data: C) => E, // "collage Function"
  pluginFunction: (data: C) => E,
) {
  return (data: C) => {
    const previousContext = previous(data as unknown as C);
    const append = pluginFunction(data);
    mergeContexts(previousContext, append as E);
    return previousContext;
  };
}

function concatReservedWords(previous: Array<string>, next?: Array<string>): Array<string> {
  return next ? previous.concat(next) : previous;
}

export default function plugin<D, C, E>(
  {
    enhanceExpose,
    enhanceUpdateContext = () => { /* noop */ },
    reservedWords,
    enhanceExtractContextAsArrangement = () => { /** noop */ },
    enhanceExtractContextAsFragment = () => { /** noop */ },
    enhanceExtractFragmentDescription = () => { /** noop */ },
  }: PluginFunctions<D, C, E>,
): Plugin<D, C, E> {
  return (previous: Collage<D, C>) => ({
    expose: buildContext(previous.expose, enhanceExpose),
    updateContext: enhanceUpdateContextBlubb(previous.updateContext, enhanceUpdateContext),
    reservedWords: concatReservedWords(previous.reservedWords, reservedWords),
    extractContextAsArrangement: extractPluginSpecificProperties(
      previous.extractContextAsArrangement,
      enhanceExtractContextAsArrangement,
    ),
    extractContextAsFragment: extractPluginSpecificProperties(
      previous.extractContextAsFragment,
      enhanceExtractContextAsFragment,
    ),
    extractFragmentDescription: extractPluginSpecificProperties(
      previous.extractFragmentDescription,
      enhanceExtractFragmentDescription,
    ),
  });
}
