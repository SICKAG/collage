/* eslint-disable @typescript-eslint/no-explicit-any */
import FeaturePage from '../pageobjects/featurePage';

describe('Direct Functions', () => {
  let collageFragment;

  beforeAll(async () => {
    await FeaturePage.open();
    await FeaturePage.directFunctions();
    const navTarget = await $('iframe');
    await (browser as any).switchToFrame(navTarget);

    collageFragment = await $('iframe');

    await (browser as any).switchToFrame(collageFragment);
  });

  it('should call a direct function', async () => {
    const output = await $('#state-output');
    expect(await output.getText()).toEqual('That\'s ridiculous.');
    await (browser as any).switchToFrame(await $('iframe'));
    expect(await output.getText()).toEqual('Two');

    await (browser as any).switchToParentFrame();
    await (browser as any).switchToParentFrame();

    const castSpellButton = await $('#btn-cast-spell');
    await castSpellButton.click();

    await (browser as any).switchToFrame(await $('iframe'));
    expect(await (await $('#state-output')).getText()).toEqual('Expecto Patronum!');
  });
});
