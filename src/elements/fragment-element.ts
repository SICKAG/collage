import { v4 } from 'uuid';

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
  fragmentContext: unknown;

  get url() {
    return this.getAttribute('url');
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

  createFragment(): void {
    const iframe = document.createElement('iframe');
    iframe.name = v4();
    iframe.src = this.url || '';
    this.appendChild(iframe);
  }
}

if (!window.customElements.get(elementName)) {
  window.customElements.define(elementName, Fragment);
}
