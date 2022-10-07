/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
declare global {
  interface Crypto {
    randomUUID: () => string;
  }
}

/**
 * rudimentary fallback uuid generator for older browsers not supporting crypto.randomUUID()
 * @returns goodenough pseudo uuid v4
 */
export function legacyFallbackUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0; const
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function v4(): string {
  return (
    (
      typeof crypto !== 'undefined'
      && crypto?.randomUUID
      && (() => crypto.randomUUID())
    )
    || legacyFallbackUUID
  )();
}

export const fragmentUuidIdentifier = 'collage-fragment';

export function createFragmentUUID() {
  return `${fragmentUuidIdentifier}-${v4()}`;
}

export function isCollageUUID(id: string) {
  return id && /^collage-fragment-[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(id);
}
