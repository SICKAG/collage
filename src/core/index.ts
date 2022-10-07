import { Plugin } from '../types';
import bootstrap from '../lib/bootstrap';
import createContext from './create-context/create-context';
import serviceFunctions from './services-plugin/service-functions/service-functions';
import handshake from './handshake-plugin/handshake';
import directFunctions from './direct-functions-plugin/direct-functions';
import simpleTopics from './topics-plugin/simple-topics/simpleTopics';
import serviceTopics from './topics-plugin/service-topics/serviceTopics';
import configPlugin from './config-plugin/config-plugin';

const plugins = [
  createContext,
  simpleTopics,
  serviceTopics,
  serviceFunctions,
  // TODO module for structured clonable services (latest v1.0!)
  directFunctions,
  configPlugin,
  handshake,
] as Array<Plugin<unknown, unknown, unknown>>;

export const {
  expose,
  updateContext,
  reservedWords,
  extractContextAsArrangement,
  extractContextAsFragment,
  extractFragmentDescription,
} = bootstrap(plugins);
