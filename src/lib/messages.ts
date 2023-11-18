import log from './logging';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const MESSAGE_TOKEN = '[collage-handshake-message-token]-1d87aa39-3bd5-4e01-b2c0-7698ea29a7da';

type Message = {
  context: string,
  type: string,
  content: unknown,
}

/**
 * Listen for postMessage events and call callback if the message matches the given type
 */
export function listenFor(
  {
    type,
    context = MESSAGE_TOKEN,
    sourceOrigin,
    listenOnce,
  }: {
    type: string,
    context?: string,
    sourceOrigin?: string,
    listenOnce?: boolean,
  },
  // TODO: which Type is message of?
  callback: (message: unknown, source: MessageEventSource) => unknown,
) {
  const listenerCallback = ({ data, origin, source }: MessageEvent) => {
    if (!sourceOrigin || sourceOrigin === origin) {
      try {
        const message = data as Message;
        if (context === message.context && type === message.type) {
          log('messages.ts', '<--', message, type);
          callback(message.content, source!);
          if (listenOnce) {
            window.removeEventListener('message', listenerCallback);
          }
        }
      } catch (e) {
        log('messages.ts', '! Rejecting message:', e);
      }
    }
  };
  window.addEventListener('message', listenerCallback);
}

/**
 * Send a postMessage event to the given recipient
 */
export function sendMessage(
  {
    recipient,
    context = MESSAGE_TOKEN,
    targetOrigin = '*',
    type,
    content = '',
  }: {
    recipient: Window,
    context?: string,
    targetOrigin?: string,
    type: string,
    content?: unknown,
  },
) {
  log('messages.ts', '-->', content, type);
  recipient.postMessage({ context, type, content }, targetOrigin);
}
