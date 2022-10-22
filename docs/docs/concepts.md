# Concepts

With Collage you can upgrade a web application of all sorts to either a micro frontend or an application capable of embedding micro frontends - basically both at the same time.
Doing so, Collage works on the scope of [HTML Documents](https://html.spec.whatwg.org/#documents) by enhancing a Document with certain capabilities, allowing them to efficiently communicate with each other.

An HTML Document enhanced this way is called a [**context**](#context)

> Behind the scenes Collage relies on iframe integration and the [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) api.
>
> When using Collage to create and embed micro frontends, always consider the common security rules for iframes.
>
> Here is a quick overview: https://blogs.halodoc.io/iframe-security-threats-and-the-prevention/
>

## Context

By calling the [expose function](../docs/core-api.html#expose-function), an HTML Document is automatically upgraded to a **context**. Being a context comes with two main features:

1. A context can embed other contexts
1. A context can be embedded into other contexts

This means, a context is always both an application embedding micro frontends and an embeddable micro frontend. The responsibility a context gets in your application depends on its relation to other contexts. A context that embeds one or more other contexts is called an [**arrangement**](#arrangement), a context that is embedded by an arrangement is called a [**fragment**](#fragment).

## Arrangement

An arrangement defines the layout and configuration of it's embedded fragments and is able to use the [**Direct Functions API**](../docs/core-api.html#direct-functions-api) to communicat with its fragments directly.

An arrangement can be a fragment itself and thus be embedded into other arrangements.

## Fragment

Any Micro Frontend with an initialized context (by calling `expose`) is called a fragment.

A fragment defines its internal layout and exposes capabilities and properties to the arrangement via the [**Frontend Description Object**](../docs/core-api.html#frontend-description).

## Frontend Description

The capabilities and features of a context are defined and described by its Frontend Description. These can be [**Services**](#service), [**Topics**](topic), [**Direct Functions**](../docs/core-api.html#direct-functions-api) or a [**Theme**](../docs/core-api.html#theme).

## Service

A Service is a function or a collection of functions and topics and is uniquely identified by its name and (optionally) version. With a Service, you can easily provide functionality to other fragments. This especially comes in handy when you want to provide application functionality like notification handles or modal dialogs to fragments.

Services have certain attributes and restrictions:

- Two implementations of a Service must allways be compatible with each other, e.g. by implementing the same specification.
- Every service exposed by a context is registered within Collage and kept synchronous between all contexts in the arrangement.
- If a context in the application is calling a specific service, always the implementation of the context that registered the Service topmost in the DOM tree is called. This means, that if a service is provided by each a fragment and its arrangement, always the implementation registered at the arrangement will be executed.
- The return value of the implementation is communicated back to the context initially calling the Service.
- A context can expose any number of Services via its Frontend Description.
- A Service is always provided to the whole Application.
- If a context wants to use a service, it must provide an own implementation itself. This is necessary, because all fragments must be [**self contained**](#self-contained).
- A Service can be imported or implemented in the context.

> Keep in mind, that it is possible to use a provided service from any embedded fragment (and also fragments embedded in fragments). So think twice about the data you want to communicate via services.
>
> If your fragment depends on data received via a service, it never should trust these data blindly, but should validate them.
>
> Don't use services to work around origin restrictions (e.g. [SOP](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) or [Same Site Cookie Restrictions](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)).

## Topics

Topics are an efficient way to communicate messages to the whole application.
To do so, a context can publish a message on that topic. Any other context, that has subscribed to that topic gets the message and can react approprietly to the message. Information about how to use topics are found in the [**Topics API**](../docs/core-api.html#topics-api) section of the [API documentation](../docs/docs/core-api/).

## Self Sufficiency

A fragment should always be able to be used standalone, meaning without an arrangement embedding it. 

Therefor it must implement all Services it wants to use in its lifecycle.

It should also be designed in such a way, that a meaningful user interaction can be provided, even when the fragment is interacted with on its own.


## (coming soon) Style Synchronization

<!-- TODO: enable section when https://deagxjira.sickcn.net/jira/browse/DAVIAF-109 is done -->

> *Comming Soon*
>
> The concept and Api descript here is NOT yet part of the current version of Collage. Is WILL however be implemented in the near future.
>
> Wording and Api itself should be considered subject to change, until the feature is implemented.

Collage will take care of seamlessly integrating the different fragments of any arrangement via Style Synchronisation.

To this end, a fragment will be able to mark any `<style>` or `<link rel="stylesheet'>` elements as a `collage-theme`

```html
<html>
  <head>
    <!-- ... -->
    <link rel="stylesheet" url="/some/style.css" data-collage-theme>
    <style data-collage-theme>
      /** ... */
    </style>
  </head>
  <body>
    <!-- ... -->
    <!-- works in the body as well -->
    <style data-collage-theme>
      /** ... */
    </style>
  </body>
</html>
```

Elements marked as `collage-theme` will get propagated from an arrangement, down to it's contained fragments. This will happen before the fragment initializes its contained fragments (if any) so the styles will cascade down to fragments that are deeper embedded.

Propagated elements will be put **at the end** of either the `<head>` or `<body>` tag, depending on which containing tag it originated from. _Older_ propagated elements (from higher up the hierarchy) will be in front of _newer_ ones and we will keep the internal order of where they have been placed intact.

In a case where the app author knowingly updates some style, he will be able to directly/manually trigger a style repropagation from the API.

We will try and find a way to automatically detect updates to those elements and retrigger the style propagation if an update occours. However, since we anticipate this automatical detection to become a bit expensive, there will be a way to opt out of automatic repropagation in which case only the initial propagation will trigger automatically and the app author has to manually trigger repropagation if he wants to dynamcally update styling later on.

Further more: style propagation can be oppted out on, if you like to follow a different route on keeping your styles in sync. In a deeper hierarchy of arrangements this will then stop propagation at the exact branch where style propagation was stopped. If you stop style propagation from an arrangement but still mark style elements as `collage-theme` within that same arrangement document, a new propagation will occour, collecting only the styles from that arrangement down.


## Initializing and exposing

Exposing a frontend to be used as a `fragment` in other `arrangements` and initializing a context for a frontend to orchestrate child `fragments` with is always done in tandem. Meaning you can't have one without the other.

To initialize your frontend and start using `Collage` functionality, first describe frontend with a **[Frontend Description object](#frontend-description)** the **[topics](#topics-api)**, **[style variables](#style-synchronization)** and **[functions](#context-api)** this specific frontend is interacting with as well as a **[config](#config)** containing metadata to describe your frontend.

```javascript
const {
  fragments: { myChild },
  services,
} = expose({
  fragmentsConfig: {
    name: "My awesome frontend",
    version: "1.0.0",
  },
  services: {
    bazz: {
      bar: () => {},
      topics: ["foo", "bar", "baz"],
    }
  }
  functions: {
    foo: () => {},
    bar: (baz) => {
      console.log(baz);
    },
  },
});
```

Functions exposed directly by your child frontend are accessible in the `initialization context` via the name you gave the child whilst defining the `collage-fragment` element for it.

This behaviour enables you to explicitly expose your children's functions as your own, so that postential parent applications can call those functions on your context later.

It also enables you to interact with child functionality while composing your own functions or define abstraction layers between your and your childrens' function contracts.

```javascript
collage.expose((fragments) => {
  // interact with your children via the name you gave them in the html
  return {
    /* ... */
    functions: {
      /**
       * forward the `something()` function call to your `foo` child
       */
      something: fragments.foo.something,

      /**
       * use child functionality in your own functions
       */
      anotherthing: (times) => {
        [...Array(5)].forEach(fragments.foo.bother("Hi!"));
      },
    },
  };
});
```
