/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * f
 *
 * @param path - f
 * @returns f
 */
export function getChildUrl(path: string): string {
  return `http://localhost:${window.location.port}/${path}`;
}

/**
 * f
 *
 * @param path - f
 */
export function createChildOnBody(path: string): void {
  const element = document.createElement('collage-fragment');
  element.setAttribute('url', getChildUrl(path));
  document.body.appendChild(element);
}

/**
 * f
 *
 * @param call - f
 * @returns f
 */
export async function callServiceOnChild(call: string): Promise<string> {
  return new Promise<string>((resolve) => {
    const doc = document.querySelector('iframe')!.contentDocument!;
    doc.addEventListener('collage-call-resolved', (event) =>
      resolve((event as CustomEvent).detail));

    const element = doc.createElement('script');
    element.innerHTML = `
      const action = async () => {
        const result = await document.services.${call}
        document.querySelector('#output').value = result
        document.dispatchEvent(new CustomEvent('collage-call-resolved', {
          detail: result
        }))
      }

      if (document.services) {
        action()
      } else {
        document.addEventListener('collage-loaded', action)
      }
    `;
    doc.body.appendChild(element);
  });
}

/**
 * f
 *
 * @param selector - f
 * @returns f
 */
export async function clickOnIframe(selector: string): Promise<unknown> {
  return new Promise<void>((resolve) => {
    const action = () => {
      const frame = document.querySelector('iframe')!;
      const element = frame.contentDocument?.querySelector(selector);
      frame.contentDocument?.body.addEventListener('bla', () => {
        resolve();
      } );
      (element as HTMLElement).click();
    };

    const observer = new MutationObserver(action);
    observer.observe(document.body, {
      attributeFilter: [ 'name' ],
      attributeOldValue: true,
      subtree: true
    });
  });
}
