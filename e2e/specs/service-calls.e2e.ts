/* eslint-disable @typescript-eslint/no-explicit-any */
import FeaturePage from '../pageobjects/featurePage';

describe('Service Calls', () => {
  let collageFragment;
  let fragmentName;

  beforeAll(async () => {
    await FeaturePage.open();
    await FeaturePage.serviceCalls();
    const navTarget = await $('iframe');
    await (browser as any).switchToFrame(navTarget);

    collageFragment = await $('iframe');
    fragmentName = await (browser as any).getElementAttribute(collageFragment.elementId, 'name');

    await (browser as any).switchToFrame(collageFragment);
  });

  it('should have a collage fragment', async () => {
    expect(collageFragment).toBeExisting();
  });

  it('should have a valid fragmentName', async () => {
    const headerContent = await $('header').getText();
    expect(fragmentName).toEqual(headerContent);
  });

  it('should call a service from child to parent', async () => {
    const serviceTriggerButton = await $('#btn-call-named-barr');
    await serviceTriggerButton.click();
    await (browser as any).switchToParentFrame();
    const output = await $('#my-output');
    expect(await output.getText()).toEqual('Barrrrr!');
  });
});
