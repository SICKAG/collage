/* eslint-disable @typescript-eslint/no-explicit-any */
import FeaturePage from '../pageobjects/featurePage';

describe('Modal', () => {
  let collageFragment;
  let bodyHeight;

  beforeAll(async () => {
    await FeaturePage.open();
    await FeaturePage.modal();

    bodyHeight = await $('body').getSize('height');

    const navTarget = await $('iframe');
    await (browser as any).switchToFrame(navTarget);

    collageFragment = await $('iframe');

    await (browser as any).switchToFrame(collageFragment);
  });

  it('should show a modal when activated', async () => {
    const setModalButton = await $('#set-modal');
    const unSetModalButton = await $('#unset-modal');

    let modalHeight = await $('body').getSize('height');
    expect(modalHeight).toBeLessThan(bodyHeight);

    await setModalButton.click();
    modalHeight = await $('body').getSize('height');
    expect(modalHeight).toBeGreaterThanOrEqual(bodyHeight);

    await unSetModalButton.click();
    modalHeight = await $('body').getSize('height');
    expect(modalHeight).toBeLessThan(bodyHeight);
  });
});
