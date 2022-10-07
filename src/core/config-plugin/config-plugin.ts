import mergeWith from 'lodash.mergewith';
import plugin from '../../lib/collage-plugin';
import {
  FrontendDescription, Fragments, PluginFunctions, GenericPluginAPI,
} from '../../types';

/**
 * Manages the handling of configuration.
 * With configurations an arrangement gets the possibility to configure an embedded fragment
 * and overwrite the default configuration of it.
 */

type PreviousContext = {
  fragments: Fragments;
  _plugins: {
    directFunctionsPlugin: {
      fragments: Fragments;
    }
  }
}

type EnhancedContext = PreviousContext & {
  config: Fragments;
}

/**
 * Get the configuration associated with a specific key
 * @param config - the config object to search in
 * @param key - the key to return a specific config
 */
export const getConfigByKey = (config: Record<string, unknown>, key?: string) => {
  try {
    return config[`${key}`];
  } catch (error) {
    return {};
  }
};

/**
 * Get the config object, which is created from all 'config-' attributes of a specific element.
 * @param element - the element to create the config object
 * @returns - the created config object
 */
export function configObjectFrom(element?: Element | null): Record<string, unknown> {
  return Array.from(element?.attributes || [])
    .filter(({ name }) => name.startsWith('config-'))
    .map(({ name, value }) => [name.replace(/config-(.*)$/, '$1'), value])
    .reduce((a, b) => ({ ...a, [b[0]]: b[1] }), {});
}

export function extractMergedConfigFromCollageFragment(element: Element, config: Record<string, unknown>) {
  const fragmentUrl = element?.getAttribute('url') as string;
  const fragmentName = element?.getAttribute('name') as string;
  const urlConfig = getConfigByKey(config || {}, fragmentUrl);
  const nameConfig = getConfigByKey(config || {}, fragmentName);
  const propertyConfig = configObjectFrom(element);

  const mergedConfig = mergeWith(mergeWith(mergeWith({}, urlConfig), nameConfig), propertyConfig);
  return mergedConfig;
}

const configPlugin: PluginFunctions<FrontendDescription, PreviousContext, EnhancedContext> = {
  enhanceExpose: (description: FrontendDescription, context: PreviousContext) => {
    document.addEventListener('collage-fragment-loaded', (event) => {
      const iframeId = (event as CustomEvent).detail;
      const fragmentElement = document.querySelector(`iframe[name='${iframeId}']`)?.closest('collage-fragment');
      if (fragmentElement) {
        const mergedConfig = extractMergedConfigFromCollageFragment(fragmentElement, description.fragmentsConfig || {});
        context._plugins.directFunctionsPlugin.fragments[iframeId].functions.updateConfig(mergedConfig);
      }
    });
  },
  reservedWords: ['updateConfig'],
  enhanceExtractContextAsFragment(data: GenericPluginAPI) {
    return {
      updateConfig: (description: FrontendDescription) => data.callback(description),
    };
  },
};

export default plugin<FrontendDescription, PreviousContext, EnhancedContext>(configPlugin);
