// import { ChainablePromiseElement } from 'webdriverio';

import Page from './page';

/**
 * sub page containing specific selectors and methods for a specific page
 */
class FeaturePage extends Page {
  // eslint-disable-next-line class-methods-use-this
  public async serviceCalls() {
    const serviceCallsLink = await $('#servicecalls');
    await serviceCallsLink.click();
  }

  // eslint-disable-next-line class-methods-use-this
  public async modal() {
    const modalLink = await $('#modal');
    await modalLink.click();
  }

  // eslint-disable-next-line class-methods-use-this
  public async directFunctions() {
    const directFunctionsLink = await $('#directfunctions');
    await directFunctionsLink.click();
  }

  // eslint-disable-next-line class-methods-use-this
  public async config() {
    const configLink = await $('#config');
    await configLink.click();
  }

  // eslint-disable-next-line class-methods-use-this
  public async reloadBug() {
    const reloadBugLink = await $('#reloadBug');
    await reloadBugLink.click();
  }

  // simpletopics
  // servicetopics

  /**
   * overwrite specific options to adapt it to page object
   */
  public open() {
    return super.open('');
  }
}

export default new FeaturePage();
