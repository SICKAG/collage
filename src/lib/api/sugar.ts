/**
 * Executes a callback if a fragment with a specific name is loaded
 * @param name - the name of the fragment
 * @param callback - the callback to be executed
 * @returns - deregister callback function - analogous to removeEventListener
 */
export function onLoaded(
  name: string,
  callback: CallableFunction,
  options?: AddEventListenerOptions | boolean | undefined,
) {
  const eventName = 'collage-fragment-loaded';
  const cb = ({ detail }: Partial<CustomEvent>) => {
    const iframe = document.querySelector(`iframe[name="${detail}"]`);
    const fragment = iframe?.closest('collage-fragment');
    const fragmentName = fragment?.getAttribute('name');
    if (fragmentName === name) {
      callback();
    }
  };
  document.addEventListener(eventName, cb, options);
  return () => document.removeEventListener(eventName, cb, options);
}

/**
 * Executes a callback if the context of this fragment is updated
 * @param callback - the callback to be executed
 * @returns - deregister callback function - analogous to removeEventListener
 */
export function onUpdated(
  callback: CallableFunction,
  options?: AddEventListenerOptions | boolean | undefined,
) {
  const eventName = 'collage-context-updated';
  const cb = ({ detail }: Partial<CustomEvent>) => { callback(detail); };
  document.addEventListener(eventName, cb, options);
  return () => document.removeEventListener(eventName, cb, options);
}

/**
 * Executes a callback if the config of this fragment is updated
 * @param callback - the callback to be executed
 * @returns - deregister callback function - analogous to removeEventListener
 */
export function onConfigUpdated(
  callback: CallableFunction,
  options?: AddEventListenerOptions | boolean | undefined,
) {
  const eventName = 'collage-context-updated';
  const cb = ({ detail }: Partial<CustomEvent>) => {
    if (detail.config) {
      callback(detail);
    }
  };
  document.addEventListener(eventName, cb, options);
  return () => document.removeEventListener(eventName, cb, options);
}
