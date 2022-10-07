/**
 * Rudimentary logging
 * @param module - module the log is invoked
 * @param info - content of the log message
 */
export default function log(module: string, ...info: unknown[]) {
  // eslint-disable-next-line no-console
  console.debug(module, `@[${window.name?.substring(0, 7)}]`, ...info);
}
