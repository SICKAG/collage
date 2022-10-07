/**
 * @copyright
 * Copyright(c) 2021 SICK AG
 */
import { Obj } from '../api/types';
import { Context } from '../model/context';
import { elementName, Fragment } from './fragment-element';

/**
 * We create the custom element for embedding child frontends only after we
 * fully created the parent context object, so that all child frontends have
 * a working Collage context to connect to.
 *
 * @param context - the Collage context to create the custom element with
 * @returns the names of all named children found on the DOM
 */
export async function embedInContext(context: Context): Promise<Array<string>> {
  Fragment.CONTEXT = context;
  await Promise.allSettled([...document.querySelectorAll(elementName)]
    .map(async (e) => (e as Fragment).registerAt(context)));

  const namedChildren = [...document.querySelectorAll(`${elementName}[name]`)]
    .map((element) => element.getAttribute('name') as string);

  namedChildren.filter((name, index) => {
    const first = index === namedChildren.indexOf(name);
    if (!first) {
      // eslint-disable-next-line no-console
      console.warn(`Registering more than one ${elementName} with the name `
        + `${name}! leads to undefined behavior of the application`);
    }
    return first;
  });
  return namedChildren;
}

/**
 * finds the contextId of a child
 *
 * @param name - name of the embeded frontend
 * @returns the contextId
 */
export function findContextAtName(name: string): string {
  return (document.querySelector(
    `${elementName}[name=${name}] iframe[name]`,
  ) as HTMLIFrameElement
  )?.name;
}

/**
 * Find the child identity containing name, url and config
 *
 * @param contextId - context to find as iframe
 * @returns child identity
 */
export function findChildIdentity(contextId: string): ChildIdentity {
  const element = document.querySelector(
    `${elementName} > iframe[name="${contextId}"]`,
  )
    ?.closest(elementName);

  return element ? {
    url: element.getAttribute('url') || undefined,
    name: element.getAttribute('name') || undefined,
    config: configObjectFrom(element),
  } : {};
}

export type ChildIdentity = {
  url?: string,
  name?: string,
  config?: Obj<unknown>
}

function configObjectFrom(element?: Element | null): Obj<string> {
  return [...(element?.attributes || [])]
    .filter(({ name }) => name.startsWith('config-'))
    .map(({ name, value }) => [name.replace(/config-(.*)$/, '$1'), value])
    .reduce((a, b) => ({ ...a, [b[0]]: b[1] }), {});
}
