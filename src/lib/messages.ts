import log from './logging';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const MESSAGE_TOKEN = '[collage-handshake-message-token]-1d87aa39-3bd5-4e01-b2c0-7698ea29a7da';

type Message = {
  context: string,
  type: string,
  content: unknown,
}

export function listenFor(
  { type, context = MESSAGE_TOKEN, sourceOrigin } : {
    type: string,
    context?: string,
    sourceOrigin?: string,
  },
  // TODO: which Type is message of?
  callback: (message: unknown, source: MessageEventSource) => unknown,
) {
  window.addEventListener('message', ({ data, origin, source }) => {
    if (!sourceOrigin || sourceOrigin === origin) {
      try {
        const message = data as Message;
        if (context === message.context && type === message.type) {
          log('messages.ts', '<--', message, type);
          callback(message.content, source!);
        }
      } catch (e) {
        log('messages.ts', '! Rejecting message:', e);
      }
    }
  });
}

export function sendMessage(
  {
    recepient,
    context = MESSAGE_TOKEN,
    targetOrigin = '*',
    type,
    content = '',
  }: {
    recepient: Window,
    context?: string,
    targetOrigin?: string,
    type: string,
    content?: unknown,
  },
) {
  log('messages.ts', '-->', content, type);
  recepient.postMessage({ context, type, content }, targetOrigin);
}
