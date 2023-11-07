# Collage

## Introduction

`Collage` is a library for creating and embedding micro frontends as `fragments`.

With Collage you can upgrade a web application of all sorts to either a micro frontend or an application capable of embedding micro frontends - basically both at the same time. Doing so, Collage works on the scope of HTML Documents by enhancing a Document with certain capabilities, allowing them to efficiently communicate with each other.

---
## Official Documentation
For information about collage and its capabilities, please have a look at our [Official Documentation](https://sickag.github.io/collage/).

---
## Developer Documentation
For details about the architecture and structure of collage, please have a look at our [Developer Documentation](./src/DEVELOPER_DOCUMENTATION.md).

## Preview
To create and embed micro frontends with collage you just need to add a few lines on top of your already existing Application:

```html
<body>
  <div class="somewhere">
    <!-- include a micro frontend effortlessly -->
    <collage-fragment
      url="/url/to/micro-frontend"
      config-something="Configure this!"
      name="my-micro-frontend">
    </collage-fragment>
  </div>
</body>
```


```js
const api = await expose({
  // expose the api of your micro frontend
  services: {
    myService(name = "") {
      return `Default Implementation for ${name}`;
    },
  },
});

```

## Features
- Upgrade any web application to a micro frontend by exposing its capabilities.
- Embed micro frontends in your application.
- Configure embedded micro frontends to fit them perfectly into your application.
- Provide services to other micro frontends and the whole Arrangement and use services, other Contexts are exposing.
- Publish messages or subscribe to topics which are available for all parts of your application.
- Micro frontends built with different frameworks can be combined to one application without effort.
- Scope Isolation Guarantees compatibility in every scenario.
- Bundle micro frontends into your application at build time or include them from any other origin - they can even be added and removed dynamically at runtime.
## Non-functional Features
- Small - Minified and gzipped, its footprint is just about 15 KB.
- Easy to use - Create a micro frontend with just a few lines of code.
- Use a self explainatory api to describe your micro frontends and orchestrate them in complex arrangements effortlessly.
- Built on web standards and only a few simple core concepts means that you never run into magic behaviour that ruins your day.
- Easy to use - Simply wrap the expose() call to create custom functionality.
