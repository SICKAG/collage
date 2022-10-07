import { describe, it, expect } from 'jest-without-globals';
import bootstrap from '../../../lib/bootstrap';
import simpleTopics from './simpleTopics';

describe('Plugin: topics stage 1', () => {
  it('should create a context with topcis specific parameters', async () => {
    const { expose } = bootstrap([simpleTopics]);

    const result = await expose({});

    expect(result).toMatchObject({
      topics: {
        publish: expect.any(Function),
        subscribe: expect.any(Function),
      },
      _plugins: {
        topicsPlugin: {
          distribute: expect.any(Function),
          subscribe: expect.any(Function),
          publish: expect.any(Function),
          getCurrentValue: expect.any(Function),
        },
      },
    });
  });
});
