/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */

import { elementName } from '../elements/fragment-element';
import { Obj } from './types';

export { hasParent } from '../Context';

// This rule is disabled on purpose here, since we construct the promise
// explicitely ourselfs instead of using the async, await syntax.
//
// Otherwise intention would not be clear, wether we return a Promise or a
// Promise to a Promise.
/* eslint-disable @typescript-eslint/promise-function-async */

/**
 * Returns a promise that resolves when all the named children, named in the
 * functions attributes are fully loaded.
 *
 * @param {...any} names - the names of the children to wait for
 */
export function loaded(...names: Array<string>): Promise<void> {
  return Promise.all(names.map((child) => new Promise<void>((resolve, reject) => {
    const container = document.querySelector(
      `collage-fragment[name=${child}]`,
    );
    if (container) {
      if (container.querySelector('iframe[name]')) {
        resolve();
      } else {
        new MutationObserver((_, observer) => {
          if (container.querySelector('iframe[name]')) {
            observer.disconnect();
            resolve();
          }
        }).observe(container, {
          subtree: true,
          childList: true,
          attributeFilter: ['name'],
        });
      }
    } else {
      reject(new Error(`No collage-fragment element with name="${child}"!`));
    }
  }))) as unknown as Promise<void>;
}

/**
 * Find all child Fragments on your dom
 *
 * @returns an info object containing all child Fragments' contexts and their names
 */
export function findChildFragments(): Obj<{name: string}> {
  return [...document.querySelectorAll(`${elementName} iframe[name]`)]
    .map((iframe: HTMLIFrameElement) => [iframe.name, iframe])
    .map(([context, iframe]) => [
      context,
      (iframe as HTMLIFrameElement).closest(elementName),
    ])
    .map(([context, childElement]) => [
      context,
      { name: (childElement as HTMLElement).getAttribute('name') },
    ])
    .reduce((p, [context, info]) => ({
      ...p,
      [(context as string)]: info,
    }), {});
}
