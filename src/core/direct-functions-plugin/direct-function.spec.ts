// TODO: write Tests for Direct Functions Plugin
import { describe, it, expect } from 'jest-without-globals';
import bootstrap from '../../lib/bootstrap';
import directFunctions from './direct-functions';

jest.mock('../index', () => ({
  reservedWords: ['reserved'],
}));

describe('Plugin: direct functions', () => {
  it('should assign functions and fragments', async () => {
    const { expose } = bootstrap([directFunctions]);

    const functions = {
      function1: () => { /* */ },
      function2: () => { /* */ },
    };
    const result = await expose({ functions });
    expect(result).toMatchObject({
      functions: {
        function1: expect.any(Function),
        function2: expect.any(Function),
      },
      fragments: expect.any(Object),
    });
  });
});

// import onLoaded from '../../lib/sugar';

// // TODO this test seems to fail _sometimes_ at the moment.
// describe('direct function call tests', () => {
//   let element: HTMLElement;
//   beforeEach(() => {
//     element = document.createElement('collage-fragment');
//     element.setAttribute('url', 'features/2-direct-functions/function-child.html');
//     element.setAttribute('name', 'harry');
//     document.body.appendChild(element);
//   });

//   afterEach(() => {
//     document.body.removeChild(element);
//   });

//   it('should be able to call a direct function', async () => {
//     const { children: { harry } } = await expose({});
//     await onLoaded('harry', () => { /**/ });
//     expect(await harry.callNibblings('Peter', 5)).toBe('5 nibblings called Peter appear');
//     expect(await harry.callFriends(3)).toBe('3 friends appear');
//     expect(await harry.getWand()).toBe('Ebony');
//   });
// });
