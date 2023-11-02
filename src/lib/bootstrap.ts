import { Collage, Plugin } from '../types';

/**
 * bootstraps all defined collage-plugins and returns a collage object
 * @param plugins to be bootstrapped
 * @returns a Collage object with all the capabilities defined by the plugins
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function bootstrap(plugins: Array<Plugin<any, any, any>>) {
  return plugins.reduce(
    (prevModule, moduleBuilder) => moduleBuilder(prevModule),
    ({
      expose: async () => ({}),
      updateContext: async () => ({}),
      reservedWords: [],
      extractContextAsArrangement: () => ({}),
      extractContextAsFragment: () => ({}),
      extractFragmentDescription: () => ({}),
    }) as Collage<unknown, unknown>,
  );
}
