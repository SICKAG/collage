import { createFragmentUUID } from '../lib/uuid';

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
   `;
}

export class Fragment extends HTMLElement {
  _context: unknown;

  set context(context: unknown) {
    this._context = context;
  }

  get context() {
    return this._context;
  }

  set url(url: string) {
    this.setAttribute('url', url);
  }

  get url(): string {
    return this.getAttribute('url') || '';
  }

  set name(name: string) {
    this.setAttribute('name', name);
  }

  get name(): string {
    return this.getAttribute('name') || '';
  }

  get uuid(): string {
    return this.dataset.uuid || '';
  }

  isComplete(): boolean {
    return !!this.url;
  }

  connectedCallback(): void {
    if (!this.querySelector('style[data-collage-child-element-style]')) {
      const style = document.createElement('style');
      style.dataset.collageChildElementStyle = '';
      style.innerHTML = customStyle();
      this.appendChild(style);
    }
    if (this.isComplete()) {
      this.createFragment();
    }
  }

  disconnectedCallback(): void {
    document.dispatchEvent(new CustomEvent(
      'collage-fragment-disconnected',
      { detail: this.dataset.uuid },
    ));
  }

  createFragment(): void {
    const iframe = document.createElement('iframe');
    iframe.name = createFragmentUUID();
    this.dataset.uuid = iframe.name;
    iframe.src = this.url || '';
    this.appendChild(iframe);
  }
}

if (!window.customElements.get(elementName)) {
  window.customElements.define(elementName, Fragment);
}
