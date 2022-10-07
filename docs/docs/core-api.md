# API

<!-- TODO: Complete API description -->

## expose Function

:::: code-group
::: code-group-item src/api/index.ts>expose

```js
// ...
expose(frontendDescription); // Returns a Promise<ContextApi>
// ...
```

:::
::::

By calling the expose function, an HTML Document is automatically upgraded to a [**Context**](/docs/concepts.html#context).
It is now embeddable and can embedd other Contexts.
The expose function can be called without a parameter, to just enable the basic Context features or called with a [**Frontend Description Object**](#frontend-description) as parameter, to enable more features of Collage.

## \<collage-fragment\> custom element

:::: code-group
::: code-group-item index.html

```html
<collage-fragment 
  url="http://path/to/the/child.html">
</collage-fragment>
```

:::
::::
Composing an application that uses other fragments as _children_ is enabled by the use of the `collage-fragment` custom element.

The name property is required, if you want to integrate it in a way that fragments can communicate and share functionality with each other. If you just want to embed a fragment in the arrangement, you simply can omit it. A frontend without a can exist on your page and interact with **[topics](#topics-api)**.

<!-- TODO: add following text, when DAVIAF-109 is done:
Collage takes care that the styling of the arrangement is **[synchronized](#style-synchronization)**.
-->

However a fragment integrated this way lives on its own - like in an iframe. Other parts of the arrangement have no access to its features.

If you wish to be able to call functions that the contained fragment exposes, you need to express a name by which you plan to interact with the child via code.
This way, when your app initializes with Collage, you will find all functions, exposed by the child fragment accessable on your context under the given name.

:::: code-group
::: code-group-item index.html

```html {3}
<collage-fragment
  url="http://path/to/the/child.html"
  name="myFragment">
</collage-fragment>
```

:::
::: code-group-item main.js

```js {2,6}
const {
  children: { myChild },
  services,
} = await expose();
onClickAt("#btn-cast-spell", () => {
  myChild.doSomeThing("with a value");
});
```

:::
::::

## Frontend Description

```js
// ...
const frontendDescription = {
  services: {/*...*/},
  functions: {/*...*/},
  config: {/*...*/},
};

const contextApi = await expose(frontendDescription);
// ...
```

A Context is described by a Frontend Description Object. It consists of three parts, describing the capabilities, behavior and identity of a fragment.
Each part is optional, you can combine them as it suites your use case.

### Services

```js
services: {
  myService(value) { 
    // do something
  }
}
```

[**Services**](/docs/concepts.html#service) are one of the core concepts of Collage. You define services in the `services` object of the Frontend Description object.

Services can either be defined singular - like `myService(value)` from the example, or be combined into a service collection - like `myNamedServices`. This especially comes in handy when you import services from third party modules.

```js
const contextApi = await expose({
  services: {
    myService(value) { 
      // do something
    },
    myNamedServices: {
      foo() {
        // do something else 
      }
      bar() {
        // again, something else 
      }
    }
  }
};

// this is how to call the defined services
context.services.myService();
context.services.myNamedServices.foo();
context.services.myNamedServices.bar();
```

#### Service with Versions

```js{3-4}
services: {
  myService: {
    versions: {
      '1.0': { aFunction: () => 'Hi from myself (version one).' },
    }
  }
}
```

When developing contract first, it is important, that the implementation of a version does not change later. To guarantee compatibiliy, service can be versioned.

On consuming the service, you then can select the implementation of a specific version.

```js{12}
const contextApi = await expose({
  services: {
    myService: {
      versions: {
        '1.0': { aFunction: () => 'Hi from myself (version one).' },
        '1.2': { aFunction: () => 'Hi from myself (improved version one).' }
      }
    }
  }
};

context.services.myService['1.2'].aFunction().then(console.log);
```

### Functions

```js
functions: {
  doSomething(value) {
    console.log('I was called directly')
  }
} 
```

In contrast to Services, Functions can be called on Contexts directly. Also, the Context calling a function does not need to expose the function it wants to call itself.

:::: code-group
::: code-group-item fragment.js

```js
expose({
  functions: {
    doSomething(value) {
      console.log('I was called directly')
    },
    doAnotherThing() {
      return 'A value';
    }
  },
});
```

:::
::: code-group-item arrangement.js

```js{2}
const contextApi = await expose();
context.children.namedChild.doSomething('my value');
```

::::

### Config

```js
config: {
  'myFragment': {
    configParam1: 'some value',
    configParam2: 'some other value',
  }
}
```

The arrangement Configuration (aka config) allows an arrangement to overwrite a default configuration of its contained fragments.
To do so, an arrangement can define config objects in three different ways which then are merged to a final config object under the hood.

Collage will merge configurations for specific fragments in following hierarchical order:
  1. a config object relating to the fragments **url**
  1. a config object relating to the **name** of the fragment 
  1. the config properties on the \<collage-fragment\> element


:::: code-group
::: code-group-item least-specific

``` js {3}
await expose({
  config: {
    'http://path/to/the/child.html': {
      title: 'by url',
      value: 'url'
      cards: 1,
      test: 'by url',
      mode: 'embedded',
    },
    // { ... configurations of other fragment }
  }
});
```

:::
::: code-group-item middle-specific

``` js{3}
await expose({
  config: {
    'myFragment': {
      title: 'by name',
      value: 'name',
      cards: 2,
      mode: 'embedded',
    },
    // { ... configurations of other fragment }
  }
});
```

:::
::: code-group-item most-specific

``` html {4-6}
<collage-fragment
  url="http://path/to/the/child.html"
  name="myFragment"
  config-title="by property"
  config-cards="3"
  config-mode="embedded">
</collage-fragment>
```

:::
::::

The configs above would combine to a config object for the fragment `myFragment` with the following properties:
```js
{
  title: 'by property',
  value: 'by name',
  cards: '3',
  test: 'by url',
  mode: 'embedded',
}
```

:::tip
It is important to understand, that the config is always set from the containing arrangement to the contained fragment. A fragment does not expose a configuration in it's FrontendDescription.
:::


#### Using config as Fragment

Via the merged config object is accessible via the [**Context API**](#context-api)

```js
const contextApi = await expose();
// is an empty object, if the arrangement does not provide a 
// config for this fragment or if the fragment is standalone
const mergedConfig = contextApi.config;

const fragmentConfiguration = {
  title: 'My own title',
  cards: 3,
  mode: 'standalone',
  ...mergedConfig // merge the config provided by the arrangement 
                  // with the fragments own config
};

```

## Communication API

Collage provides several APIs for different tasks of communication inside the application.
### Context API

The [expose function](#expose-function) returns a ContextApi object:

```js
const contextApi = {
  services: { /* ... */ },  // services exposed by this Context
  children: { /* ... */ },  // all contained fragments
  topics: { /* ... */ },    // exposed topics
  config: { /* ... */ },    // config described by containing arrangement
  id: 'contextId',          // context id
};
```

By calling the expose function, you get access to the Context API. You can call services, access named children (see [Initializing and Exposing](/docs/concepts.html#initializing-and-exposing)) config and id as well as publish and subscribe to topics.

The expose function returns a Promise\<ContextApi\>, so you can simply await on it or do something in its then-callback.
:::: code-group
::: code-group-item await

```js
const contextApi = await expose({
  services: {
    todos: {
      topics: ["active"],
    },
    // ...
  },
});
```
:::
::: code-group-item then()

```javascript
expose(/* ... */).then((context) => {
  // ...
});
```

:::
::::

### Child Functions

```javascript
const contextApi = await expose(/* ... */);
context.child.someFunction();
```

To use [functions](#functions) of the fragment, you need direct access to the fragments Context. You gain that via the Context APIs children object

### Topics API

See [**Topics**](/docs/concepts.html#topics) in the [Concepts description](/docs/concepts/).

<!-- TODO: write section -->

The syntax orients on [**RxJS**](https://rxjs.dev)

#### Publishing Messages

```javascript
const contextApi = await expose(/* ... */);
context.topics.someTopic.post(aMessage);
```

#### Subscribing to topics

```javascript
const contextApi = await expose(/* ... */);
context.topics.someTopic.subscribe((msg) => doSomeThing(msg));
```
<!-- 
There are use cases in which only a single subscriber should be able to react on messages to a certain topic.
This is possible to configure via the options object.

```javascript
collage.expose(/* ... */).then((context) => {
  // ...
  context.topics.someTopic.subscribe((msg) => doAThing(msg), { discardMessage: true });
}); -->
