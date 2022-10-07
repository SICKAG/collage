# Collage


## Introduction

- `Collage` is a library for creating and embedding micro frontends as `fragments`.
- A `fragment` is a micro frontend that is described with the `Collage` library.
- An `arrangement` is a composition of one or more `fragments`.
- A `fragment` can be an `arrangement` itself.
- A `fragment` should always be self contained

For further documentation, please see [features](/docs/docs/features.md), [concepts](/docs/docs/concepts.md) and [api](/docs/docs/core-api.md), as well as the [getting-started](/docs/guide/getting-started.md)


> **Caution!**
> 
> Since you do not know how a possible Arrangement might fill the config values you 
> expect, and since they might set those values on the DOM, meaning all values 
> would be of type string, you cannot assume any specific type for your config
> values.
>
> Be prepared, to use `Number(config.key)` or Template strings or other sensible
> type mappings for your needs.

## Current State

* [x] create custom element
* [x] add 'name' attribute to custom element
* [ ] add 'disconnected' attribute to custom element
* [x] translate initialisation for simple services
* [x] translate initialisation for complex services
* [ ] add named Fragments in initialisation (init with function)
* [x] translate usage of simple services
* [x] translate usage of complex services
* [x] add direct function calls on named Fragments
* [x] translate api for topic initialisation
* [x] translate api for topic usage
* [ ] create unsubscribe in API v1

## Discussion and open points

* **[Topic-message-origin]** Do we need/want a generic (core) way to communicate
  the origin of a message that has been published onto a topic?
  This would simplify usecases like navigation and may be of broader use.

## Known Bugs

* **[TopicBug]** Some strange behaviour with topics needs to be resolved, where
  a topic subscriber would always get 'subscribed [topic]' as first message and
  would later on not be able to receive a new message with exactly that wording


