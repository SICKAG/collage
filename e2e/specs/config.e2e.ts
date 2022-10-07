/* eslint-disable @typescript-eslint/no-explicit-any */
import FeaturePage from '../pageobjects/featurePage';

describe('Config', () => {
  beforeAll(async () => {
    await FeaturePage.open();
    await FeaturePage.config();
    const navTarget = await $('iframe');
    await (browser as any).switchToFrame(navTarget);
  });

  it('should overwrite the config of a fragment', async () => {
    const collageFragment = await $('iframe');
    await (browser as any).switchToFrame(collageFragment);
    const output = await $('#config-display');
    expect(await output.getText())
      .toEqual('{"embedded":true,"name":"overProperty","bla":"urlOnly","blub":"childOnly","test":"Halloho"}');
    await (browser as any).switchToParentFrame();
  });

  it('should update the config of a fragment at a later point', async () => {
    const updateConfigButton = await $('#updateBtn');
    await updateConfigButton.click();
    await (browser as any).switchToFrame(await $('iframe'));
    const output = await $('#config-display');
    expect(await output.getText()).toEqual('{"check":1,"overwritten":"new"}');
  });
});
