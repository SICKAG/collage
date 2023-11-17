/* eslint-disable @typescript-eslint/no-explicit-any */
import FeaturePage from '../pageobjects/featurePage';

describe('Reload bug', () => {
  beforeAll(async () => {
    await FeaturePage.open();
    await FeaturePage.reloadBug();

    const navTarget = await $('iframe');
    await (browser as any).switchToFrame(navTarget);
  });

  it('should only trigger one new publish, when a fragment is getting reloaded', async () => {
    const reloadButton = await $('#btn');
    const output = await $('#output');
    await reloadButton.click();
    await expect(output).toHaveChildren(2);

    await reloadButton.click();

    await expect(output).toHaveChildren(3);
  });

  it('should update fragment config correctly, when a fragment is getting reloaded', async () => {
    const reloadButton = await $('#btn');
    await reloadButton.click();
    const collageFragment = await $('iframe');
    await (browser as any).switchToFrame(collageFragment);
    const output = await $('#config');
    const config = await output.$('li');

    await expect(output).toHaveChildren(1);
    await expect(config).toHaveText('{"mode":"single"}');

    await (browser as any).switchToParentFrame();
    await reloadButton.click();
    await (browser as any).switchToFrame(collageFragment);

    await expect(output).toHaveChildren(1);
    await expect(config).toHaveText('{"mode":"single"}');
  });
});
