// TODO: write Tests for Config Plugin
import { describe, it, expect } from 'jest-without-globals';
import { configObjectFrom, extractMergedConfigFromCollageFragment, getConfigByKey } from './config-plugin';

describe('Plugin: config', () => {
  it('getConfigByKey', async () => {
    const config = {
      test: {
        foo: '1',
        bar: 123,
      },
      ident: {
        name: 'My awesome frontend',
        version: '1.0.0',
      },
    };
    const expectedConfig = {
      name: 'My awesome frontend',
      version: '1.0.0',
    };

    expect(getConfigByKey(config, 'ident')).toMatchObject(expectedConfig);
  });

  it('configObjectFrom', async () => {
    const expectedConfig = {
      name: 'My awesome frontend',
      version: '1.0.0',
    };
    const element = document.createElement('div');
    element.setAttribute('config-version', '1.0.0');
    element.setAttribute('config-name', 'My awesome frontend');
    const result = configObjectFrom(element);
    expect(result).toMatchObject(expectedConfig);
  });

  it('configObjectFrom', async () => {
    const expectedConfig = {
      name: 'My awesome frontend',
      version: '1.0.0',
    };
    const element = document.createElement('div');
    element.setAttribute('config-version', '1.0.0');
    element.setAttribute('config-name', 'My awesome frontend');
    const result = configObjectFrom(element);
    expect(result).toMatchObject(expectedConfig);
  });

  describe('extractMergedConfigFromCollageFragment', () => {
    it('Merged configs with increasing importance: from url, from name of element, from properties of element ', () => {
      const expectedConfig = {
        urlOnly: 'url',
        nameOnly: 'name',
        'property-only': 'property',
        merged: 'fromProperty',
      };

      const config = {
        './fragment.html': {
          urlOnly: 'url',
          merged: 'fromUrl',
        },
        child: {
          nameOnly: 'name',
          merged: 'fromName',
        },
      };
      const element = document.createElement('collage-fragment');
      element.setAttribute('url', './fragment.html');
      element.setAttribute('name', 'child');
      element.setAttribute('config-property-only', 'property');
      element.setAttribute('config-merged', 'fromProperty');

      const result = extractMergedConfigFromCollageFragment(element, config);
      expect(result).toMatchObject(expectedConfig);
    });

    it('Should not throw an error if no url attribute was given ', () => {
      const expectedConfig = {
        nameOnly: 'name',
        'property-only': 'property',
        merged: 'fromProperty',
      };

      const config = {
        './fragment.html': {
          urlOnly: 'url',
          merged: 'fromUrl',
        },
        child: {
          nameOnly: 'name',
          merged: 'fromName',
        },
      };
      const element = document.createElement('collage-fragment');
      element.setAttribute('name', 'child');
      element.setAttribute('config-property-only', 'property');
      element.setAttribute('config-merged', 'fromProperty');

      const result = extractMergedConfigFromCollageFragment(element, config);
      expect(result).toMatchObject(expectedConfig);
    });

    it('Should not throw an error if no name attribute was given ', () => {
      const expectedConfig = {
        urlOnly: 'url',
        'property-only': 'property',
        merged: 'fromProperty',
      };

      const config = {
        './fragment.html': {
          urlOnly: 'url',
          merged: 'fromUrl',
        },
        child: {
          nameOnly: 'name',
          merged: 'fromName',
        },
      };
      const element = document.createElement('collage-fragment');
      element.setAttribute('url', './fragment.html');
      element.setAttribute('config-property-only', 'property');
      element.setAttribute('config-merged', 'fromProperty');

      const result = extractMergedConfigFromCollageFragment(element, config);
      expect(result).toMatchObject(expectedConfig);
    });
  });
});
