/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { expose } from 'src';

describe('service call tests', () => {
  it('should be able to expose a callable service', async () => {
    const context = await expose({
      services: { theService: () => 'My Value' }
    });
    await expectAsync(context.services.theService()).toBeResolvedTo('My Value');
  });

  it('should be able to expose a named service with callable functions', async () => {
    const { services: { named } } = await expose({
      services: {
        named: { theService: () => 'The other Value' }
      }
    });
    await expectAsync(named.theService()).toBeResolvedTo('The other Value');
  });
});
