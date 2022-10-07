import plugin from '../lib/collage-plugin';
import { FckTs } from '../types';

type ServiceContext = Record<string, unknown>

type Definition = {
  services?: ServiceContext
}

type Expected = {
  arrangement?: ServiceContext,
}
type Provided = ServiceContext & Expected

const first = (name: FckTs) => ({
  in: (...things: FckTs[]) => (
    (things.find((x) => x && x[name]) || {})[name]
  ),
});

export default plugin<Definition, Expected, Provided>(
  async ({ services }, context) => ({
    asArrangement: { services },
    services: new Proxy({}, {
      get(_, name) {
        return first(name).in(context.arrangement?.services, services);
      },
    }),
  }),
);
