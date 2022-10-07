import { Expose, Plugin } from '../types';
import createContext from './create-context';
import serviceFunctions from './service-functions';
import createArrangement from './arrangement';
import directFunctions from './integrate-direct-functions';

type ExposeApi = ReturnType<typeof serviceFunctions>

const plugins = [
  createContext,
  serviceFunctions,
  // TODO module for structured clonable services (latest v1.0!)
  directFunctions,
  createArrangement,
] as Array<Plugin<unknown, unknown, unknown>>;

const expose = plugins.reduce(
  (app, plugin) => plugin(app),
  (async () => ({})) as Expose<unknown, unknown>,
);
export default expose as ExposeApi;
