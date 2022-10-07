/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */

import { Context } from '../model/context';

export const elementName = 'collage-fragment';

function customStyle(): string {
  return `
    ${elementName} {
      display: flex;
      justify-content: stretch;
      align-items: stretch;
    }
    ${elementName} > iframe {
      border: none;
      flex: 1;
      height: auto%;
      width: 100%;
    }
    ${elementName} > iframe:not([name]) {
      display: none !important;
    }
  `;
}

/**
 * The custom element
 */
export class Fragment extends HTMLElement {
  static CONTEXT?: Context;

  context?: Context;

  /**
   * Registers this Fragment at a specific context.
   * If there is already a different context set, it is first deregistered at
   * the former context object.
   *
   * @param context - the context to register this Fragment at
   */
  async registerAt(context: Context): Promise<void> {
    if (this.context) {
      await this.deregister();
    }
    this.context = context;
    await this.register();
  }

  /**
   * registers this micro fontend at it's context
   */
  async register(): Promise<void> {
    if (this.context) {
      const url = this.getAttribute('url');
      if (url) {
        await (this.context?.registerChildContext(url, this));
      } else {
        throw new Error(`Attribute url is required for <${elementName}>!`);
      }
    }
  }

  /**
   * deregisteres this Fragment from it's context
   */
  async deregister(): Promise<void> {
    if (this.contextId) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await (this.context?.deregisterChildContext(this.contextId));
    }
  }

  /**
   * we register the child context at the Collage context when the element becomes
   * connected to the DOM
   */
  connectedCallback(): void {
    if (!this.context) {
      this.context = Fragment.CONTEXT;
    }
    if (!this.querySelector('style[data-collage-child-element-style]')) {
      const style = document.createElement('style');
      style.dataset.collageChildElementStyle = '';
      style.innerHTML = customStyle();
      this.appendChild(style);
    }
    this.register();
  }

  /**
   * the contextId of this embeded frontend, given it is initialized correctly
   */
  get contextId(): string | undefined {
    return this.querySelector('iframe')?.name;
  }

  /**
   * we DEregister the child context at the Collage context when the element becomes
   * disconnected from the DOM
   */
  disconnectedCallback(): void {
    this.deregister();
  }
}

if (!window.customElements.get(elementName)) {
  window.customElements.define(elementName, Fragment);
}
