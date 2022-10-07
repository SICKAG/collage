/* eslint-disable arrow-body-style */
import plugin from '../../lib/collage-plugin';
import {
  Fragments, Functions, PluginFunctions, FrontendDescription, GenericPluginAPI,
} from '../../types';
import log from '../../lib/logging';
import { reservedWords } from '../index';

type PreviousContext = { /** */ }

export type EnhancedContext = PreviousContext & {
  fragments: Fragments;
  functions: Functions;
  _plugins: {
    directFunctionsPlugin: {
      fragments: Fragments;
    }
  }
}

function executeFunction(context: EnhancedContext, fragmentID: string, functionName: string) {
  return (
    (context._plugins.directFunctionsPlugin.fragments as Fragments)[fragmentID].functions as Functions)[functionName];
}

/**
 * Manages the communication via direct functions.
 * Direct functions can be called on contexts directly.
 * A fragment can provide such functions to its arrangement, which therefore can executed this functions.
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
              log('direct-functions.ts', (context as EnhancedContext)._plugins.directFunctionsPlugin.fragments);
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

const directFunctionsPlugin: PluginFunctions<FrontendDescription, PreviousContext, EnhancedContext> = {
  enhanceExpose({ functions }: FrontendDescription, context: PreviousContext) {
    document.addEventListener('collage-fragment-disconnected', (e) => {
      // Object.keys(context._plugins.directFunctionsPlugin.fragments).some(((e as CustomEvent).detail))
      const fragmentID = (e as CustomEvent).detail;
      delete (context as EnhancedContext)._plugins.directFunctionsPlugin.fragments[fragmentID];
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
