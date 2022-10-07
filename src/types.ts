import { SimpleTopicsAPI } from './core/topics-plugin/simple-topics/model';

/**
 * Record of Services
 */
export type Services = Record<string, unknown>;

/**
 * Record of Functions
 */
export type Functions = Record<string, CallableFunction>;

/**
 * A context is described by a Description object. It can consist of three parts,
 * describing the capabilities, behaviour and identity of an fragment.
 *
 * @property services - the services, provided by a fragment. Services can contain pure service functions,
 * nested services and / or services mixed with topic services
 * @property functions - the functions, provided from this fragment to its arrangement.
 * @property config - allows an arrangement to overwrite a default configuration of its embe fragments
 */
export type FrontendDescription = {
  services?: Services, // services we provide to the fragments
  functions?: Functions, // functions we provide to the arrangement
  fragmentsConfig?: Record<string, unknown>, // config we provide to our fragments
}

export type GenericPluginAPI = {
  context: {
    _plugins: Record<string, unknown>,
    functions: Functions,
  },
  description: FrontendDescription,
  frameId: string,
  functions: Functions,
  callback: CallableFunction,
}

/**
 * Functions to enhance the expose and updateContext Functions by a plugin
 */
export type PluginFunctions<D, C, E> = {
  enhanceExpose: (description: D, context: C) => Promise<E> | E | void,
  enhanceUpdateContext?: (context: C) => Promise<E> | E | void,
  reservedWords?: Array<string>,
  enhanceExtractContextAsArrangement?: (data: GenericPluginAPI) => unknown,
  enhanceExtractContextAsFragment?: (data: GenericPluginAPI) => unknown,
  enhanceExtractFragmentDescription?: (data: GenericPluginAPI) => unknown,
}

/**
 * extractContextAsArrangement: Extracts the important information from a context, needed by a fragment from its
 * arrangement
 */
export type Collage<D, C> = {
  expose: (description: D) => Promise<C>,
  updateContext: (context: C) => Promise<C>,
  reservedWords: Array<string>,
  extractContextAsArrangement: (data: GenericPluginAPI) => unknown,
  extractContextAsFragment: (data: GenericPluginAPI) => unknown,
  extractFragmentDescription: (data: GenericPluginAPI) => unknown,
}

/**
 * Enhances collage with additional features
 */
export type Plugin<D, C, E> =
  (previous: Collage<D, C>) => Collage<D, E>

/**
 * Record of Fragments
 */
export type Fragments = Record<string, { functions: Functions, __fragmentId: string }>;

/**
 * Represents the state of a Fragment at runtime
 */
export type Context = FrontendDescription & {
  id?: string,
  fragments?: Fragments,
  _plugins?: Record<string, unknown>,
}

/**
 * The ContextApi object is returned from the expose function.
 * @property id - context id of the fragment
 * @property services - services exposed by this context
 * @property topics - topics exposed by this context
 * @property fragments - all contained named fragments
 * @property config - our own overwriten config
 */
export type ContextApi = {
  id: string;
  services: Services;
  fragments: Fragments;
  config: Record<string, unknown>;
  topics: SimpleTopicsAPI & Record<string, unknown>;
}
