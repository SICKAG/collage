/* eslint-disable @typescript-eslint/no-non-null-assertion */
const THE_CONTEXT = 'rasztexrdytcufvgibkhgvjycfhtdxrgzs';

// eslint-disable-next-line no-console
const log = console.debug;

type Message<T> = {
  context: string,
  type: string,
  message: T,
}

export function listenFor<T>(
  { type, context = THE_CONTEXT, targetOrigin } : {
    type: string,
    context?: string,
    targetOrigin?: string,
  },
  callback: (message: T, source: MessageEventSource) => unknown,
) {
  window.addEventListener('message', ({ data, origin, source }) => {
    if (!targetOrigin || targetOrigin === origin) {
      try {
        const message = data as Message<T>;
        if (context === message.context && type === message.type) {
          log('<--', message);
          callback(message.message, source!);
        }
      } catch (e) {
        log('! Rejecting message:', e);
      }
    }
  });
}

export function createSender(
  {
    recepient,
    context = THE_CONTEXT,
    targetOrigin = '*',
    type,
  }: {
    recepient: Window,
    context?: string,
    targetOrigin?: string,
    type: string,
  },
) {
  return <T>(message: T) => {
    log('-->', message);
    recepient.postMessage({ context, type, message }, targetOrigin);
  };
}
