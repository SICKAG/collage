/**
* main page object containing all methods, selectors and functionality
* that is shared across all page objects
*/
export default class Page {
  /**
  * Opens a sub page of the page
  * @param path path of the sub page (e.g. /path/to/page.html)
  */
  // eslint-disable-next-line class-methods-use-this
  public open(path: string) {
    return browser.url(`http://localhost:3000/${path}`);
  }
}
