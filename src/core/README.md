# Core Concepts

The core concepts and their implementations as plugins build upon each other and each enhance collage by their specific features.

1. The `<collage-fragment>` custom element.
1. The `create-context` plugin
1. The `handshake` plugin
1. The `service-functions` plugin
1. The `service-topics` plugin
1. The `simple-topics` plugin

### Notes

How the connection between arrangement and fragment works:

The connection is mediated by the custom element, since that is the point where we are in the parents code context but acually know about a specific child to connect.

A successful connection then enhances the fragments context with methods from the arrangement.

## Create Context

The most basic concept in collage is that of a context. At it's base a context is simply the representation of a uniquly identified fragment and the connection to a potential parent.

This takes no argument.

And creates the following context api:

```javascript
{
  // unique (uuidv4) context id
  id: 'xxxx-xxxx-xxxx-xxxx'

  // wether we are embedded in another arrangement
  hasArrangement: true || false
}
```

## Handshake



> penpal wants to always initiate a handshake from parent to child, while we intend to do it the other way round, so we are setting up the handshake in a separate plugin

The handshake between us and a potential parent works like this:

1. before `expose` is called (during the import), a beacon for potential fragments is initialized.
2. when a fragment calls `expose`, it sends a _ping_ postMessage to the window at `window.parent`
3. when after 300ms no answer arrives, we asume to be alone and end the handshake
4. if we receive an answer message, we assume to be embedded in an arrangement. 

For a more detailled description of the handshake, see [Handshake plugin documentation](./handshake-plugin/README.md).

## Simple services

Using penpal, we expose a number of functions that we can use ourselfs later on. These functions may be overwritten by a arrangement if one exists and if it contains a service function with the same name.

```javascript
const {
  services: {
    // You are guaranteed to receive service functions for all service functions
    // you did expose. Some of them may be overwritten though.
    foo, bar, baz
  }
} = await expose({
  // any number of named functions that act as an overwritable service
  services: {
    foo() { /* ... */ },
    bar() { /* ... */ },
    baz() { /* ... */ },
  }
})
```

Each service function should act as follows, when called:

1. attempt to obtain the penpal-parent connection
2. (if connected) attempt to call service function on penpal parent
3. (if successful) return the returned value to the client
4. (if not connected or no such service on parent) call own implementation and return the return value


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
