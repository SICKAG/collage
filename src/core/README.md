# Core Concepts

Core concepts and their implementations build upon each other.

## Notes

How the connection between arrangement and fragment should work:

The connection should be mediated be the custom element, since that is the point where I am in the parents code context but acually know about a specific child I want to connect.

A successful connection should then augment the childs context with _stuff_ from the parent.

Problems:
  - if the context is not **global**, then how can we get hold of it in the 
    custom element
  - exactly HOW do we modify that context and what is the result
  - how do we keep a separation of domains? We don't want to know about configuration or services at this point.

> Maybe use a custom event for which we can initiate event handlers (with bubbeling) during expose?

> Maybe the custom element listens for a specific postMessage call that should get sent by the contained document **IF** it is a collage fragment.
> If such a message occours, the listener will:
> 1. mediate a penpal connection
> 2. 

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

### Parent handshake

The handshake between us and a potential parent works like this:

1. before `expose` is even called (during the import), a beacon for potential fragments is initialized.
2. when a fragment calls `expose`, it sends a _ping_ postMessage to the window at `window.parent`
3. when after 300ms no answer arrives, we asume to be alone and end the handshake here
4. if we receive a answer message, we assume to be embedded in an arrangement. 

That's it


## Simple services

Using penpal, we expose a number of functions that we can use ourselfs later on. These functions may be overwritten by a arrangement if one exists and if it contains a service function with the same name.


> **ATTENTION** penpal wants to always initiate a handshake from parent to child, while we intend to do it the other way round (!)

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
