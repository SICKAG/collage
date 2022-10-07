/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { connectToChild, connectToParent, Methods } from 'penpal';
import { createSender, listenFor } from '../lib/messages';
import { Plugin } from '../types';

type Expected = {
  // as arrangement I provide THESE things to my fragments
  // (services, topics, config)
  asArrangement?: Record<string, unknown>,
  // as fragment I provide THESE things to the arrangment that embeds me
  // (direct functions)
  asFragment?: Record<string, unknown>,
}

type Provided = Expected & {
  /**
   * The context of the arrangment that embeds us
   */
  arrangement?: Record<string, unknown>,
  /**
   * The contexts of the fragments we embed, indexed by their frame id
   * (iframe.name)
   */
  fragments: Record<string, Record<string, unknown>>
}

const callArrangement = window.parent !== window
  ? createSender({
    recepient: window.parent,
    type: 'call-for-arangement',
  })
  : () => { /* noop */ };

const callFragment = <T>(recepient: Window, message: T) => createSender({
  recepient,
  type: 'call-back-to-fragment',
})(message);

const callToReinitialize = (iframe: Element) => createSender({
  recepient: (iframe as HTMLIFrameElement).contentWindow!,
  type: 'reinitialize-fragment',
})('----');

const sendFragmentLoaded = (recepient: Window) => createSender({
  recepient,
  type: 'initialize-fragment-complete',
})(window.name);

const onFragmentLoaded = (
  callback: (id:string, source: MessageEventSource) => unknown,
) => listenFor(
  { type: 'initialize-fragment-complete' },
  callback,
);

function whenFragmentsCall(
  provideContext: () => Record<string, unknown>,
  embedContext: (id: string, child: Record<string, unknown>) => void,
) {
  listenFor<string>({ type: 'call-for-arangement' }, (id) => {
    const iframe = document.querySelector(
      `collage-fragment > iframe[name="${id}"]`,
    );
    if (iframe) {
      connectToChild({
        iframe: iframe as HTMLIFrameElement,
        methods: provideContext() as Methods,
        debug: true,
      }).promise.then((child) => embedContext(id, child));

      callFragment((iframe as HTMLIFrameElement).contentWindow!, window.origin);
    }
  });
}

export default (function createArrangement(expose) {
  return async (definition = {}) => {
    const context = await expose(definition) as Provided;
    context.fragments = {};

    onFragmentLoaded((id) => document.dispatchEvent(new CustomEvent(
      'collage-fragment-loaded',
      { detail: id },
    )));

    listenFor<string>({ type: 'call-back-to-fragment' }, async (
      origin,
      source,
    ) => {
      const parentConnection = connectToParent({
        parentOrigin: origin,
        methods: context.asFragment as Methods,
      });

      // TODO describe: we do this two times:
      //  1 for initialization,
      //  2. when we get triggered later by an arrangement to reinitialize.
      context.arrangement = await parentConnection.promise;
      sendFragmentLoaded(source as Window);

      listenFor({
        type: 'reinitialize-fragment',
        targetOrigin: origin,
      }, async (_, reinitSource) => {
        context.arrangement = await parentConnection.promise;
        sendFragmentLoaded(reinitSource as Window);
      });
    });
    callArrangement(window.name);

    whenFragmentsCall(
      () => (context.asArrangement || {}),
      (id, child) => { context.fragments[id] = child; },
    );

    document.querySelectorAll('collage-fragment > iframe[name]')
      .forEach(callToReinitialize);
    return context;
  };
}) as Plugin<unknown, Expected, Provided>;

// TODO test wether it is possible to be "to fast" in using services.
