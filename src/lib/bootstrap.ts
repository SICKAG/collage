import { Collage, Plugin } from '../types';

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
