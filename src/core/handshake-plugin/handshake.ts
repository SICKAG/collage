/* eslint-disable no-use-before-define */
import {
  CallSender,
  Connection,
  connectToChild,
  connectToParent,
} from 'penpal';
import merge from 'lodash.mergewith';
import { updateContext } from '../index';
import plugin, { mergeContexts } from '../../lib/collage-plugin';
import log from '../../lib/logging';
import { sendMessage, listenFor } from '../../lib/messages';
import {
  initiateData,
  extractAsArrangement,
  extractFragmentDescriptionFromPenpalChild,
  extractArrangementFromPenpalParent,
  extractAsFragment,
} from './handshake-data';
import {
  Context,
  ContextApi,
  Fragments,
  FrontendDescription,
  Functions,
  GenericPluginAPI,
} from '../../types';

/**
 * Manages the handshake and communication states between a Fragment and an Arrangement
 *
 * Sequence Diagram: see {@link arrangement.md}
 */

// TODO: Add a possibility to pass the penpal debug flag at runtime
const PENPAL_DEBUG = false;

type PreviousContext = {
  fragments: Fragments
}

/**
 * Message Types used for Handshake
 */
const messageTypes = {
  callForArrangement: 'call-for-arrangement',
  answerToCallForArrangement: 'answer-to-call-for-arrangement',
  reinitializeFragment: 'reinitialize-fragment',
  reloadedFragment: 'reloaded-fragment',
};

type Connections = Map<string, Connection<CallSender>>;

/**
 * Handshake Step A-1
 * Listen for messages F-1.1 from potential Fragments calling for their Arrangement
 */
function listenForCallForArrangement(
  connections: Connections,
  data: { description: FrontendDescription, context: unknown },
) {
  log('arrangement.ts', 'A1. listenForCallForArrangement()');
  listenFor({
    type: messageTypes.callForArrangement,
  }, (id) => { answerToCallForArrangement(data)(connections, id as string); });
}

/**
 * Handshake Step F-1
 * Check if we are embedded in an arrangement by sending a message and waiting for an answer A-3.1 from arrangement.
 */
function callForArrangement(data: { description: FrontendDescription, context: unknown }) {
  log('arrangement.ts', 'F1. callForArrangement()');
  listenForAnswerToCallForArrangement(data);

  sendMessage({
    type: messageTypes.callForArrangement,
    recipient: window.parent,
    content: window.name,
  });
}

/**
 * Handshake Step F-2
 * Listen for messages A-4 from Arrangement answering to Step F-1.1, callForArrangement
 */
function listenForAnswerToCallForArrangement(data: { description: FrontendDescription, context: unknown }) {
  log('arrangement.ts', 'F2. listenForAnswerToCallForArrangement()');
  const windowParent = { ...window.parent };
  listenFor({
    type: messageTypes.answerToCallForArrangement,
    sourceOrigin: windowParent.origin,
  }, () => connectToArrangement(data));
}

/**
 * Handshake Step A-2
 * Connect to fragment, which send the message F-1.1 and answer to it (A-4)
 */
function answerToCallForArrangement(data: { description: FrontendDescription, context: unknown }) {
  return (connections: Connections, fragmentId: string) => {
    const iframe = findFragmentInDOM(fragmentId);
    if (iframe && iframe.contentWindow) {
      // If a fragment triggers a window.reload we need to do this check.
      // Penpal will handle clean up for us, when a child is getting reloaded.
      // But therefore we are not allowed to call connectToChild from parent again.
      if (!connections.get(fragmentId)) {
        connections.set(fragmentId, connectToFragment(iframe, data));
      } else {
        listenFor({
          type: messageTypes.reloadedFragment,
          listenOnce: true,
        }, (id) => {
          if (id === fragmentId) {
            document.dispatchEvent(new CustomEvent(
              'collage-fragment-loaded',
              { detail: fragmentId },
            ));
          }
        });
      }
      log('arrangement.ts', 'A2. answerToCallForArrangement()');
      // Handshake Step A-3.2
      sendMessage({
        type: messageTypes.answerToCallForArrangement,
        recipient: iframe.contentWindow,
        content: window.origin,
      });
    }
  };
}

/**
 * Handshake Step A-3
 * Starting a penpal connection to a fragment (A-3.1) and merge the new context to the old (A-3.3).
 */
function connectToFragment(
  fragmentIframe: HTMLIFrameElement,
  data: { description: FrontendDescription, context: unknown },
) {
  log('arrangement.ts', 'A3. connectToFragment()');
  // Step A-3.1 - uses penpal function "connectToChild"
  const connection = connectToChild({
    iframe: fragmentIframe,
    methods: extractAsArrangement(data),
    // TODO: is there a more secure way to enable redirects? Maybe using the preflight check in some way?
    childOrigin: '*',
    debug: PENPAL_DEBUG,
  });

  // Listener for (penpal) connectToArrangement
  connection.promise.then((child) => extractFragmentDescriptionFromPenpalChild(
    {
      frameId: fragmentIframe.name,
      functions: child as unknown as Functions,
    },
  )).then(async (contextPart) => {
    await updateAndMergeContext(merge(data.context, contextPart));
    document.dispatchEvent(new CustomEvent(
      'collage-fragment-loaded',
      { detail: fragmentIframe.name },
    ));
  });

  return connection;
}

/**
 * Handshake Step F-3
 * Starting a penpal connection, update the context and reinitialize the own fragments
 */
function connectToArrangement(data: { description: FrontendDescription, context: unknown }) {
  log('arrangement.ts', 'F3. connectToArrangement()');
  // Step F-3.1 - uses penpal function "connectToParent"
  connectToParent({
    methods: extractAsFragment({
      description: data.description,
      context: data.context as GenericPluginAPI,
      callback: (description: FrontendDescription) => updateConfigCallback(description)(data.context),
    }),
    debug: PENPAL_DEBUG,
  }).promise
    .then((result) => extractArrangementFromPenpalParent(result as unknown as FrontendDescription))
    .then(async (arrangementData) => {
      // We only need to listen for reinitialize-fragments message, if we have an arrangement
      const newDescription = {
        _plugins: {
          servicePlugin: {
            branchServices: await arrangementData.services,
          },
        },
      };

      listenForReinitializeFragment(data);
      updateAndMergeContext(merge(data.context, newDescription));
      reinitializeFragments();
      sendMessage({
        type: messageTypes.reloadedFragment,
        recipient: window.parent,
        content: window.name,
      });
    });
}

function updateConfigCallback(arrangementDescription: FrontendDescription) {
  return (context: unknown) => {
    (context as ContextApi).config = arrangementDescription;
    updateAndMergeContext(context as Context);
  };
}

/**
 * Handshake Step A-3.3 and F-3.3
 * Update the context and merge it with the old one.
 */
async function updateAndMergeContext(context: Context) {
  log('arrangement.ts', 'A-3.3 / F-3.3 updateContext');
  const nextContext = await updateContext(context);
  mergeContexts(context, nextContext as Context);
  document.dispatchEvent(new CustomEvent(
    'collage-context-updated',
    { detail: context },
  ));
}

/**
 * Handshake Step F-3.4
 * Reinitialize all own fragments
 */
function reinitializeFragments() {
  log('arrangement.ts', 'F-3.3 reinitializeFragments()');
  document.querySelectorAll('collage-fragment > iframe[name]')
    .forEach(sendReinitializeMessage);
}

/**
 * Handshake Step F-3.4
 * Send a reinitialize message to the Fragment
 */
function sendReinitializeMessage(iframe: Element) {
  const { name, contentWindow } = iframe as HTMLIFrameElement;
  log('arrangement.ts', 'F-3.4 sendReinitializeMessage()', name);
  if (contentWindow) {
    sendMessage({
      type: messageTypes.reinitializeFragment,
      recipient: contentWindow,
    });
  } else {
    log('arrangement.ts', 'F-3.4 !empty iframe', name);
  }
}

/**
 * Handshake Step F-3.2
 * Listen for message F-3.4 and restart with step F-1
 */
function listenForReinitializeFragment(data: { description: FrontendDescription, context: unknown }) {
  log('arrangement.ts', '?. listenForReinitializeFragment()');
  const windowParent = { ...window.parent };
  listenFor({
    type: messageTypes.reinitializeFragment,
    sourceOrigin: windowParent.origin,
  }, () => callForArrangement(data));
}

function findFragmentInDOM(fragmentId: string): HTMLIFrameElement | null {
  return document.querySelector(
    `collage-fragment > iframe[name="${fragmentId}"]`,
  );
}

function disconnectFragment(context: PreviousContext, fragmentId: string, connections: Connections) {
  Object.keys(context.fragments).some((fragmentName) => {
    if (context.fragments[fragmentName].__fragmentId === fragmentId) {
      connections.get(fragmentId)?.destroy();
      connections.delete(fragmentId);
      delete context.fragments[fragmentName];
      return true;
    }
    return false;
  });
}

export default plugin({
  enhanceExpose: (description: FrontendDescription, context: PreviousContext) => {
    const connections: Connections = new Map();
    const data = initiateData({ description, context });
    listenForCallForArrangement(connections, data);
    if (window !== window.parent) {
      callForArrangement(data);
    }

    document.addEventListener('collage-fragment-disconnected', (e) => {
      disconnectFragment(context, (e as CustomEvent).detail, connections);
    });
  },
});
