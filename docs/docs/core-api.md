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

By calling the expose function, an HTML Document is automatically upgraded to a [**Context**](./concepts.html#context).
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

The name property is required, if you want to integrate it in a way that fragments can communicate and share functionality with each other. If you just want to embed a fragment in the arrangement, you simply can omit it. A frontend without it can exist on your page and interact with **[topics](#topics-api)**.

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
  fragments: { myFragment },
  services,
} = await expose();
onClickAt("#btn-cast-spell", () => {
  myFragment.functions.doSomeThing("with a value");
});
```

:::
::::

To be sure, that the initialization process is completed and the embedded fragment can be used on the arrangement, there is a sugar method called _onLoaded_. This function takes the name of a fragment as first parameter and a callback as second.

```js {2,6}
const context = await expose();
onLoaded("myFragment", () => {
  context.fragments.myFragment.functions.doSomeThing("with a value");
});
```


## Frontend Description

```js
// ...
const frontendDescription = {
  services: {/*...*/},
  functions: {/*...*/},
  fragmentsConfig: {/*...*/},
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

[**Services**](./concepts.html#service) are one of the core concepts of Collage. You define services in the `services` object of the Frontend Description object.

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

#### coming soon - Service with Versions

<details>
<summary markdown="span">Services with versions are currently not supported, but will be integrated soon</summary>

<div style="opacity: 0.65; border: solid 1px; border-radius: 5px; padding: 0 10px 0 10px">

```js
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
</div>
</details>

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
context.fragments.namedChild.functions.doSomething('my value');
```

::::  

### Config

```js
fragmentsConfig: {
  'myFragment': {
    configParam1: 'some value',
    configParam2: 'some other value',
  }
}
```

The arrangement Configuration (aka fragmentsConfig) allows an arrangement to overwrite a default configuration of its contained fragments.
To do so, an arrangement can define config objects in three different ways which then are merged to a final config object under the hood.

Collage will merge configurations for specific fragments in following hierarchical order:
  1. a config object relating to the fragments **url**
  1. a config object relating to the **name** of the fragment 
  1. the config properties on the \<collage-fragment\> element


:::: code-group
::: code-group-item least-specific

``` js {3}
await expose({
  fragmentsConfig: {
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
  fragmentsConfig: {
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

It takes some time for the arrangement to overwrite the config of its fragment. To be sure that the config was updated from the arrangement, the sugar method _onConfigUpdated_ can be used. This function takes a callback, which it will execute, when the config was updated. But be careful: if there is no arrangement or the config is not overwritten, this callback will never be executed!

```js
const contextApi = await expose();
onConfigUpdated(() => {
  const config = contextApi.config;
  const mergedConfig = {
    title: 'My own title',
    cards: 3,
    mode: 'standalone',
    ...config 
  }; 
  // do something, when the config was updated
});

```

It is also possible to update a configuration of an embedded fragment at a later time.
Therefore the _updateConfig_ method exists on embedded named fragments.

::: tip
The configuration of the fragment will be completely overwritten by the new config. 
If a merged configuration with the old config is desired, the merge must be done by yourself.
:::

```javascript
  const config = {
    title: 'I am embedded',
    mode: 'embedded',
  }; 
  context.fragments.myFragment.updateConfig(config);
```

## Communication API

Collage provides several APIs for different tasks of communication inside the application.
### Context API

The [expose function](#expose-function) returns a ContextApi object:

```js
const contextApi = {
  services: { /* ... */ },  // services exposed by this Context
  fragments: { /* ... */ },  // all contained named fragments
  topics: { /* ... */ },    // exposed topics
  config: { /* ... */ },    // config described by containing arrangement
  id: 'contextId',          // context id
};
```

By calling the expose function, you get access to the Context API. You can call services, access named children (see [Initializing and Exposing](./concepts.html#initializing-and-exposing)), config and id as well as publish and subscribe to topics.

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
contextApi.fragments.childName.functions.someFunction();
```

To use [functions](#functions) of the fragment, you need direct access to the fragments Context. You gain that via the Context APIs framents object

### Topics API

See [**Topics**](./concepts.html#topics) in the [Concepts description](./concepts/).

The Topics feature allows an easy way to subscribe to topics and publish new values on them.

There are two different topic types, that can be used with collage, simple topics and service topics.
For both topic types, it is possible to subscribe multiple times for the same topic.

::: tip
Do not use `subscribe`, and `publish` as Topic names or as names for Services with Topics!
:::

::: tip
When subscribing to a topic which has never been published a value to, the subscription callback gets initially called with undefined as message.
:::

#### Simple Topics
Topics are defined dynamically at runtime and don`t need to be defined in the Frontend Description Object.

##### Subscribing to topics
To subscribe to a topic, the topic name and a callback is needed. The subscribe returns an unsubscribeCallback, which can be used to unsubscribe again.

```javascript
const contextApi = await expose();
const unsubscribeCallback = contextApi.topics.subscribe('myTopic', (msg) => doSomeThing(msg));
```
##### Unsubscribing a topic
To unsubscribe from a topic just call the unsubscribeCallback.

```javascript
unsubscribeCallback();
```

##### Publishing Messages

```javascript
const contextApi = await expose();
contextApi.topics.publish('myTopic', 'a new Value');
```

#### Service Topics
Topics are defined in services at dev-time in the Frontend Description Object, like following:

```javascript
const frontendDescription = {
  services: { 
    foo: {
      topics: ['myTopic']
    }
  }
};
const contextApi = await expose(frontendDescription);
```
##### Subscribing to topics
To subscribe to a topic, the topic name and a callback is needed. The subscribe returns an unsubscribeCallback, which is needed to unsubscribe again.

```javascript
const unsubscribeCallback = contextApi.topics.foo.myTopic.subscribe((msg) => doSomeThing(msg));
```

##### Unsubscribing a topic
To unsubscribe from a topic, just call the unsubscribeCallback.

```javascript
unsubscribeCallback();
```

##### Publishing Messages

```javascript
contextApi.topics.foo.myTopic.publish('a new Value');
```


### Lifecycle Hooks
Collage is asynchronous. To trigger certain activities in an Arrangement or Fragment, you can use Lifecycle Hooks.

A hook returns a function, which can be executed to deregister the hook (analogous to addEventListener and removeEventListener).

 ```js {3,8}
// Register a hook
const context = await expose();
const deregisterHook = onUpdated(() => {
  context.fragments.myFragment.functions.doSomeThing("with a value");
});

// Deregister
deregisterHook();
```

A hook accepts an options argument, which takes the same options analogous to addEventListener.
```js {4,7}
// EventListenerOptions
const context = await expose();
const callback = () => { context.fragments.myFragment.functions.doSomeThing("with a value"); }
const options = { once: true };
// Callback will only be executed once.
// No need for using the returned deregister function
onUpdated(callback, options);
```
##### onLoaded
To be sure, that the initialization process is completed and the embedded fragment can be used on the arrangement, this hook exists. This hook takes the name of a fragment as first parameter and a callback as second. The third parameter is optional and represents the options argument of addEventListener.

The onLoaded hook Executes a callback if a fragment with a specific name is loaded.

 ```js {2-4}
const context = await expose();
onLoaded("myFragment", () => {
  context.fragments.myFragment.functions.doSomeThing("with a value");
});
```
The onLoaded hook is based on the `collage-fragment-loaded` event, which is dispatched, if an embedded fragment is completed with the initial loading. The event emits the context id of the fragment, which was loaded.
You can use the event if necessary, but you should prefere the hook. 

##### onUpdated
Executes a callback if the context of this fragment is updated. This hook takes a callback as first parameter. The second parameter is optional and represents the options argument of addEventListener.

 ```js {2-5}
const context = await expose({ services: { doSomething: () => {} } } );
onUpdated(() => {
  // E.g. service from parent can be used. Not own implementation
  context.services.doSomeThing();
});
```

The onUpdated hook is based on the `collage-context-updated` event, which is dispatched, everytime something on the own context changed. The event emits the updated context.
You can use the event if necessary, but you should prefere the hook. 

##### onConfigUpdated
Executes a callback if the config of this context was updated. This hook takes a callback as first parameter. The second parameter is optional and represents the options argument of addEventListener.

 ```js {2-9}
const context = await expose();
onConfigUpdated(() => {
  const mergedConfig = {
    title: 'My own title',
    cards: 3,
    mode: 'standalone',
    ...context.config, 
  }; 
  // do something, when the config was updated
});
```

The onUpdated hook is based on the `collage-context-updated` event, which is dispatched, everytime something on the own context changed. The event emits the updated context.
You can use the event if necessary, but you should prefere the hook. 

### Deregistering a fragment
If you want to remove a fragment from your arrangement, just remove it from the DOM. Collage takes care that the parents context gets cleaned up.

:::tip
There are several possibilities how to remove an HTML Element from the DOM, for a reference, please see ['Element.remove() - mdn web docs'](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove) or ['Node.removeChild() - mnd web docs'](https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild).

If you are using a framework managing the DOM, please see the specific frameworks documentation.

:::
