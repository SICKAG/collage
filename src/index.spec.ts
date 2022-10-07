import { describe, it, expect } from 'jest-without-globals';
import { expose } from './index';

describe('Libary setup', () => {
  it('should export `expose`', () => {
    expect(expose).toBeDefined();
  });
});
