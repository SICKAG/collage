# Internal structure of the collage library
## collage-plugin
Collage is build as a plugin library. Each basic feature is defined as a plugin. All default plugins are configured and bootstrapped together.

Each collage plugin needs to call the plugin function. The shape and general structure of a plugin is defined here.

## bootstrap
Bootstraps all defined collage-plugins into a collage object (see [Collage](../types.ts))
The collage object then contains the functions `expose`, `updateContext`, `extractContextAsArrangement`, `extractContextAsFragment` and `extractFragmentDescription` as well as an `reservedWords` array.

The `reservedWords` are identifiers, which are reserved for collage and plugins and can not be defined as e.g. direct functions by a micro-frontend (see [direct-functions-plugin](../core/direct-functions-plugin/direct-functions.ts)).

The `updateContext` function is used by the syntactic sugar functions (see [Syntactic Sugar API](./api/sugar.ts)).

The `expose` function is the only function which is exported directly to be used in the micro-frontends.

The other functions are for setting up a collage context and performing the handshake between Fragment and Arrangement.

## logging
Module for internal logging

## messages
When establishing the connection between a fragment and its arrangement, penpal is not available for communication jet. So we are using the postMessage Api directly for performing a handshake.

## uuid
util functions to define unique ids for fragments
