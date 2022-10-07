/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import expose from 'src/api';
import { loaded } from 'src/api/sugar';

// TODO this test seems to fail _sometimes_ at the moment.
xdescribe('direct function call tests', () => {
  let element: HTMLElement;
  beforeEach(() => {
    element = document.createElement('collage-fragment');
    element.setAttribute('url', 'features/2-direct-functions/function-child.html');
    element.setAttribute('name', 'harry');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('should be able to call a direct function', async () => {
    const { children: { harry } } = await expose({});
    await loaded('harry');
    expect(await harry.callNibblings('Peter', 5)).toBe('5 nibblings called Peter appear');
    expect(await harry.callFriends(3)).toBe('3 friends appear');
    expect(await harry.getWand()).toBe('Ebony');
  });
});
