import plugin from '../lib/collage-plugin';
import { FckTs } from '../types';

export default plugin<
  { functions: Record<string, CallableFunction> },
  { fragments: Record<string, {
    functions: Record<string, CallableFunction>
  }> },
  { children: Record<string, unknown> }
>(async (definition, context) => ({
  asFragment: { functions: definition.functions || {} },
  children: Object.fromEntries(
    [...document.querySelectorAll('collage-fragment[name]') as FckTs]
      .map((element) => [
        element.getAttribute('name'),
        ...[...element.querySelectorAll('iframe[name]')]
          .map((iframe) => iframe.getAttribute('name')),
      ])
      .map(([name, id]) => [name, new Proxy({}, {
        get: (__, fn: string) => context.fragments[id]?.functions[fn],
      })]),
  ),
}));
