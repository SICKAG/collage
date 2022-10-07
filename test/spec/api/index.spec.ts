/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */

import expose from '../../../src/api/index';

describe('api usage', () => {
  it('should assume a sensible default, on an empty expose object', async () => {
    const context = expose();

    expect(context).toBeDefined();
  });
});
