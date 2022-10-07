import { v4 } from 'uuid';
import plugin from '../lib/collage-plugin';

function subscribe(topic: string, callback: (message: unknown) => unknown) {
  return v4();
}

function unsubscribe(id: string) {
  // ...
}

function publish(topic: string, message: unknown) {
  // ...
}

export default plugin(async () => ({
  asArrangement: {},
  topics: { subscribe, unsubscribe, publish },
}));
