# Core Concepts

The core concepts and their implementations as plugins build upon each other and each enhance collage by their specific features.

1. The [collage-fragment](../elements/README.md) custom element.
1. The [create-context](./create-context/CREATE_CONTEXT.md) plugin
1. The [handshake](./handshake-plugin/HANDSHAKE.md) plugin
1. The [direct functions](./direct-functions-plugin/DIRECT_FUNCTIONS.md) plugin
1. The [services](./services-plugin/SERVICES.md) plugin
1. The [topics](./topics-plugin/TOPICS.md) plugin

### Notes

How the connection between arrangement and fragment works:

The connection is mediated by the custom element, since that is the point where we are in the parents code context but actually know about a specific child to connect.

A successful connection then enhances the fragments context with methods from the arrangement.

## Create Context
The most basic concept in collage is that of a context. At it's base a context is simply the representation of a uniquly identified fragment and the connection to a potential parent.

For a more detailled description of the handshake, see [Create Context plugin documentation](./create-context/CREATE_CONTEXT.md).


## Handshake
To set up the communication between a fragment and an arrangement, collage performs a handshake between them.

For a more detailled description of the handshake, see [Handshake plugin documentation](./handshake-plugin/HANDSHAKE.md).

## Service Functions
Services are functions, an arrangement can provide to all the fragments (and their fragments).

For a more detailled description of the service functions, see [Services plugin documentation](./services-plugin/SERVICES.md).

## Direct Functions
Direct Functions can be called on a fragment directly by its arrangement

For a more detailled description of direct functions, see [Direct Functions plugin documentation](./direct-functions-plugin/DIRECT_FUNCTIONS.md).

## Topics
The Topics feature allows an easy way to subscribe to topics and publish new values to topics.

For a more detailled description of the topics plugin, see [Topics plugin documentation](./topics-plugin/TOPICS.md).

## Config
With configurations an arrangement gets the possibility to configure an embedded fragment and overwrite the default configuration of it.

For a more detailled description of the config plugin, see [Config plugin documentation](./config-plugin/CONFIG_PLUGIN.md).


## Finalize Api

The last module to be performed will trim the resulting context api to the fields that we intend a client to use. 

Any internal state that may have been needed to communicate between plugin modules should not be visible in client context.



## Fragment <-> Arrangement

**In the fragment**

1. collect stuff for my children
2. collect my exposed functions (child functions)
3. simple beacon request --> get simple beacon answer?
4. `connectToParent` with my functions -> gain parent services
5. add parent stuff to context
6. send `collage-initialized` event
7. all my fragments will initialize iframes
  1. create iframe
  2. send _what is your id?_ as post message
  3. await answer
  4. if answer: `connectToChild`

**In the arrangement**

1. setup a beacon
2. When a question arrives -> check if we have a matching fragment element (id)
3. initiate `connectToChild` with the iframe in that element
4. send response

```javascript
const definition = {
  services: {},
  topics: {},
  configuration: {},
  functions: {},
}

const context = await expose(description)

const arrangementContext = connectToArrangement(description, context)

const combined = combineContexts(context, arrangementContext)

createBeacon(combined, (question) => {
  if (findFragmentInDOM(question)) {
    connectToChild()
    sendAnswer()
  }
})

return combined
```

```html
<collage-fragment context-id="1234-12344-1234">
```
