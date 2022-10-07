/**
 * @copyright
 * Copyright(c) 2020 SICK AG
 */

import { ServiceMap } from '../api/types';
import { getCssVariablesFromDocument } from '../utils/functions';
import { createObject } from '../utils/transforms';
import { ThemableContextApi, ThemedFrontendDescription, Theme } from './themable-types';
import { Expose } from './types';

const bodyData = document.body.dataset;
const themeState = {
  pending: 'pending',
  ok: 'ok',
};

/**
 * optionally allow for strict anti-flickering via `data-await-theme`
 */
document.querySelectorAll('[data-await-theme]').forEach(initAntiFlickering);

/**
 * Adds theme support to a Collage expose function
 *
 * @param expose - the Collage expose function, to add theme support to
 */
export default function themable(expose: Expose): Expose {
  return async function themableExpose(description: ThemedFrontendDescription = {})
    : Promise<ThemableContextApi> {
    // eslint-disable-next-line no-prototype-builtins
    if (!bodyData.hasOwnProperty('themeState')) {
      initAntiFlickering();
    }

    const defautTheme = description.theme || collectCssVariables();

    const ctx = await expose({
      ...description,
      services: {
        ...themeServices(defautTheme),
        ...description.services,
      },
    });

    const { services: { _theme }, topics: { _themeChange: { change } } } = ctx;

    setCssVariables(await _theme());

    change.subscribe(ignoreFirstCall(setCssVariables));
    return {
      ...ctx,
      theme: {
        change(variables) {
          change.publish(variables);
        },
      },
    };
  };
}

function initAntiFlickering(element = document.body) {
  // eslint-disable-next-line no-param-reassign
  element.dataset.themeState = themeState.pending;
  const baseStyle = document.createElement('style');
  baseStyle.innerHTML = `[data-theme-state=${themeState.pending}] {display: none;}`;
  document.head.appendChild(baseStyle);
}

/**
 * TODO needed because of 'initial value' topic bug
 *
 * @param fn - function to call
 */
function ignoreFirstCall(fn: CallableFunction) {
  let ignore = true;
  return (...args: Array<unknown>) => {
    if (ignore) {
      ignore = false;
      return undefined;
    }
    return fn(...args);
  };
}

function createStyle() {
  const style = document.createElement('style');
  style.dataset.collageActiveTheme = 'true';
  document.head.appendChild(style);
  return style;
}

function setCssVariables(variables: Theme) {
  bodyData.themeState = themeState.pending;
  const style = document.querySelector('style[data-collage-active-theme]')
    || createStyle();

  style.innerHTML = `:root {
  ${Object.entries(variables)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n')}
  }`;
  document.querySelectorAll('[data-theme-state=pending]').forEach((element) => {
    // eslint-disable-next-line no-param-reassign
    (element as HTMLElement).dataset.themeState = themeState.ok;
  });
}

function themeServices(defaultTheme: Theme): ServiceMap {
  return {
    // TODO this is only two services because of a known bug in complex services
    _theme: () => defaultTheme,
    _themeChange: {
      topics: ['change'],
    },
  };
}

/**
 * TODO
 * Collects all css variables that are exposed for `:root` from the
 * document.
 *
 * @returns the css variables, defined on this document for ':root'
 */
function collectCssVariables(): Theme {
  return [...getCssVariablesFromDocument().entries()]
    .reduce(...createObject()) as Theme;
}
