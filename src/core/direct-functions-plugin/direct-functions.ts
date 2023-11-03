/* eslint-disable arrow-body-style */
import plugin from '../../lib/collage-plugin';
import {
  Fragments, Functions, PluginFunctions, FrontendDescription, GenericPluginAPI,
} from '../../types';
import log from '../../lib/logging';
import { reservedWords } from '../index';

/**
 * The Direct Functions Plugin enhances the fragment with the possibility to provide fuctions
 * to the arrangement directly.
 */

/**
 * There are no specific requirements to the context before this plugin is applied.
 */
type PreviousContext = { /** */ }

/**
 * After applying this plugin, the context has the following properties
 * @property fragments - a proxy object, which provides access to the embedded fragments (sub fragments of this one)
 * @property functions - a proxy object, which provides access to the functions of this fragment
 * @property _plugins - a property, which contains all plugins, which are applied to this fragment - especially
 * the direct functions plugin
 */
export type EnhancedContext = PreviousContext & {
  fragments: Fragments;
  functions: Functions;
  _plugins: {
    directFunctionsPlugin: {
      fragments: Fragments;
    }
  }
}

/**
 * Executes a function on a fragment
 * @param context - the arrangement context
 * @param fragmentID - the id of the fragment, which provides the function
 * @param functionName - the name of the function
 */
function executeFunction(context: EnhancedContext, fragmentID: string, functionName: string) {
  return (
    (context._plugins.directFunctionsPlugin.fragments as Fragments)[fragmentID].functions as Functions)[functionName];
}

/**
 * Creates a proxy handler for the functions of a fragment
 * @param context - the arrangement context
 * @param fragmentID - the id of the fragment, which provides the function
 * @returns a proxy handler for the functions of a fragment
 */
function functionsHandler(context: EnhancedContext, fragmentID: string): ProxyHandler<Functions> {
  return {
    get: (__: unknown, fn: string) => {
      return executeFunction(context, fragmentID, fn);
    },
  };
}

/**
 * Creates a proxy for each embedded fragment of an arrangement,
 * so a direct function can be called directly on the fragments name like following:
 * `context.fragments.nameOfChild.foo()`
 * @param context - the arrangement context
 */
function initFragmentsFunctions(context: PreviousContext) {
  return Object.fromEntries(
    Array.from(document.querySelectorAll('collage-fragment[name]'))
      .map((element) => [
        // get the name of the embedded fragment, to create a proxy on it.
        // Is needed to enable calling direct functions on the childs name
        element.getAttribute('name') || '',
        ...Array.from(element.querySelectorAll('iframe[name]')).map((iframe) => (iframe.getAttribute('name') || '')),
      ])
      .map(([name, fragmentID]) => [
        name,
        new Proxy(
          {},
          {
            get: (__, fn: string) => {
              log('direct-functions.ts', (context as EnhancedContext)._plugins.directFunctionsPlugin?.fragments);
              if (fn === 'isProxy') {
                return true;
              } if (fn === '__fragmentId') {
                return fragmentID;
              }
              if (![...reservedWords, 'functions'].includes(fn)) {
                throw new Error('invalid access of a parameter'); // TODO: write better error message
              } else if (fn === 'functions') {
                return new Proxy({}, functionsHandler((context as EnhancedContext), fragmentID));
              }
              return executeFunction((context as EnhancedContext), fragmentID, fn);
            },
          },
        ),
      ]),
  );
}

/**
 * The Direct Functions Plugin enhances the fragment with the possibility to provide fuctions
 * to the arrangement directly.
 *
 * It does so by adding a functions property to the context, which is a proxy to all functions defined by
 * the fragment. This proxy is also available on the fragments property of the context, so it can be called
 * directly on the fragments name like following:
 * `context.fragments.nameOfChild.foo()`
 * It also adds a fragments property to the context, which is a proxy to all embedded "sub" fragments of the fragment.
 *
 * The plugin takes care to clean up the proxies, when a fragment is removed from the arrangement. This is done
 * by listening to the collage-fragment-disconnected event.
 */
const directFunctionsPlugin: PluginFunctions<FrontendDescription, PreviousContext, EnhancedContext> = {
  enhanceExpose({ functions }: FrontendDescription, context: PreviousContext) {
    document.addEventListener('collage-fragment-disconnected', (e) => {
      // Object.keys(context._plugins.directFunctionsPlugin.fragments).some(((e as CustomEvent).detail))
      const fragmentID = (e as CustomEvent).detail;
      delete (context as EnhancedContext)._plugins.directFunctionsPlugin?.fragments[fragmentID];
    });

    return {
      functions,
      fragments: initFragmentsFunctions(context),
    } as EnhancedContext;
  },
  enhanceUpdateContext(context: PreviousContext) {
    return {
      fragments: initFragmentsFunctions(context),
    } as EnhancedContext;
  },
  enhanceExtractFragmentDescription(data: GenericPluginAPI) {
    return {
      _plugins: {
        directFunctionsPlugin: {
          fragments: {
            [data.frameId]: { functions: data.functions },
          },
        },
      },
    };
  },
  enhanceExtractContextAsFragment(data: GenericPluginAPI) {
    return { ...data.context.functions };
  },
};

export default plugin<FrontendDescription, PreviousContext, EnhancedContext>(directFunctionsPlugin);
