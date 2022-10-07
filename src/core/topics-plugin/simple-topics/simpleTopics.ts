import plugin from '../../../lib/collage-plugin';
import { v4 } from '../../../lib/uuid';
import {
  FrontendDescription, PluginFunctions, Fragments, Services, GenericPluginAPI,
} from '../../../types';
import { SimpleTopicsAPI, InternalTopicsAPI } from './model';
import { EnhancedContext as DirectFunctionsEnhancedContext } from '../../direct-functions-plugin/direct-functions';
import log from '../../../lib/logging';

/**
 * Manages the communication with a publish subscribe mechanism where topics can be dynamically defined at runtime.
 *
 * Sequence Diagram: see {@link README.md}
 */

type PreviousContext = DirectFunctionsEnhancedContext & {
  services: Services;
}

type EnhancedContext = PreviousContext & {
  topics: SimpleTopicsAPI;
  _plugins: InternalTopicsAPI
}
class SimpleTopics {
  subscriptions: Map<string, Map<string, CallableFunction>> = new Map();

  topics: Map<string, unknown> = new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(private context: PreviousContext) {
    // constructor to be able to create a TopicsApi with a passed context
  }

  /**
   * Subscribes to a topic and executes a callback whenever a value is published on the topic
   * @param topic - topic of intrest
   * @param callback - to be executed when a value is published on the topic
   * @returns subscriptionId: string
   */
  subscribe(topic: string, callback: (message: unknown) => unknown): () => void {
    const subsciptionId = v4();
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Map());
    }
    if (this.subscriptions.get(topic)?.has(subsciptionId)) {
      throw new Error(`subscription with id ${subsciptionId} already exists`);
    }
    this.subscriptions.get(topic)?.set(subsciptionId, callback);
    (this.context.services?.getCurrentValue as CallableFunction)(topic).then((lastValue: unknown) => {
      callback(lastValue);
    });

    const unsubscribeCallback = () => {
      this.subscriptions.get(topic)?.delete(subsciptionId);
    };
    return unsubscribeCallback;
  }

  /**
   * Unsubscribe a subscription
   * @param subscriptionId - id of the subscription to unsubscribe
   */
  unsubscribe(subscriptionId: string): void {
    // eslint-disable-next-line no-param-reassign
    Object.values(this.subscriptions).forEach((subscription) => { delete subscription[subscriptionId]; });
  }

  /**
   * Executes own callbacks for the topic subscription and triggers this for its direct embedded fragments
   * @param topic - topic to distribute
   * @param message - message to distribute
   */
  distribute(topic: string, message: unknown): void {
    // if (this.subscriptions[topic as string]) {
    if (this.subscriptions.get(topic)) {
      this.subscriptions.get(topic)?.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          log('simpleTopics', error);
        }
      });
    }

    if (this.context._plugins.directFunctionsPlugin) {
      Object.values(this.context._plugins.directFunctionsPlugin.fragments as Fragments).forEach((fragment) => {
        try {
          fragment.functions.distribute(topic, message);
        } catch (error) {
          log('simpleTopics', error);
        }
      });
    }
  }

  /**
   * Is triggered when a new value is published on a topic.
   * It is part of an service, which will always be executed by the topmost arrangement
   * and will then spread two all its descendants.
   */
  onPublish(topic: string, message: unknown) {
    this.topics.set(topic, message);
    this.distribute(topic, message);
  }

  /**
   * Get the current / last value for a topic.
   * This is part of an service and will always be executed by the topmost arrangement
   */
  getCurrentValue(topic: string): unknown {
    return this.topics.get(topic);
  }
}

const topicsPlugin: PluginFunctions<FrontendDescription, PreviousContext, EnhancedContext> = {
  enhanceExpose: (__, context: PreviousContext) => {
    const simpleTopics = new SimpleTopics(context);
    return {
      topics: {
        publish: (topic: string, message: unknown) => {
          (context.services?.publish as CallableFunction)(topic, message);
        },
        subscribe: (topic: string, callback: (message: unknown) => unknown) => {
          if (!callback || typeof callback !== 'function') {
            throw new Error('missing or invalid parameter callback for subscribe(topic, callback)');
          }
          return simpleTopics.subscribe(topic as string, callback);
        },
      },
      _plugins: {
        topicsPlugin: {
          distribute: (topic: string, message: unknown) => { simpleTopics.distribute(topic, message); },
          subscribe: (
            topic: string,
            callback: (message: unknown) => unknown,
          ) => simpleTopics.subscribe(topic, callback),
          publish: (topic: string, message: unknown) => { simpleTopics.onPublish(topic, message); },
          getCurrentValue: (topic: string) => simpleTopics.getCurrentValue(topic),
        },
      },
    } as EnhancedContext;
  },
  reservedWords: ['distribute'],
  enhanceExtractContextAsArrangement: (data: GenericPluginAPI) => ({
    services: {
      publish: (data.context._plugins as InternalTopicsAPI)?.topicsPlugin.publish,
      getCurrentValue: (data.context._plugins as InternalTopicsAPI)?.topicsPlugin.getCurrentValue,
    },
  }),
  enhanceExtractContextAsFragment(data: GenericPluginAPI) {
    return {
      distribute: (data.context._plugins as InternalTopicsAPI)?.topicsPlugin.distribute,
    };
  },
};

export default plugin<FrontendDescription, PreviousContext, EnhancedContext>(topicsPlugin);
