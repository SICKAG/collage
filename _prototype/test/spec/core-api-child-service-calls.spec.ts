/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { expose } from 'src';
import { elementName } from 'src/elements/fragment-element';
import { createChildOnBody, callServiceOnChild } from './test-utils';

/**
 * TODO this test only passes half the time. The other half it resolves to call
 * the child service instead of grapping the parent implementation.
 * Why? ... this seems to only occour in Karma context, when other tests are
 * preformed as well.
 * FIXME this should be mittigated bevore going alpha!
 */
xdescribe('parent->child services', () => {
  it('child context service calls', async () => {
    const services = {
      foo() {
        return 'I am in Fooo';
      },
    };
    createChildOnBody('static/spec-child.html?foo');

    await expose({ services });
    await expectAsync(callServiceOnChild('foo()')).toBeResolvedTo('I am in Fooo');
  });

  afterEach(() => {
    document.querySelectorAll(elementName).forEach((e) => e.remove());
  });
});
