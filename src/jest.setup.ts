import { legacyFallbackUUID } from './lib/uuid';

// Stub away crypto api
Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => legacyFallbackUUID(),
  },
});
