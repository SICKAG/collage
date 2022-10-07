import { FckTs, Plugin } from '../types';

export default function plugin<D, E, P>(
  pluginFunction: (definition: D, context: E) => Promise<P>,
): Plugin<D, E, P> {
  return (expose) => async (definition) => {
    const context = await expose(definition);
    const append = await pluginFunction((definition || {}) as D, context);
    Object.entries(append).reduce((target, [name, value]) => {
      // eslint-disable-next-line no-param-reassign
      (target as FckTs)[name] = value;
      return target;
    }, context);
    return context as unknown as E & P;
  };
}
