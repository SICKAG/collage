# Developer Documentation

Before starting to develop collage, please read the documentation about the collage [features](../docs/docs/features.md), [core concepts](../docs/docs/concepts.md) and [core api](../docs/docs/core-api.md).

## Getting started

```bash
git clone https://github.com/SICKAG/collage.git
cd collage
npm install
```

Now you are ready for developing

### Start the dev server

You can start the dev server by running

```bash
npm run dev
```

This will start a dev server. You can then view and debug the example and integration tests defined in the sample folders of the plugins (src/core/)

### Running the tests

You can (and should) keep the unit test running in watch mode while developing

```bash
npm run test:watch
```

> Hint: you can keep the dev server and the unit test running at the same time

## What we are building upon:

- typescript (see [typescript](https://www.typescriptlang.org/) and [tsconfig.json](../tsconfig.json))
- vite for serving our examples and integration tests and bundling the library (see [vite](https://vitejs.dev) and [vite.config.js](../vite.config.js))
- jest for unit tests (see [jest](https://jestjs.io) and [jest.config.js](../jest.config.js))
- vuepress for building our user documentation (see [vuepress](https://vuepress) and [vuepress-config.mjs](../docs/vuepress-config.mjs))
- github actions for ci/cd
- penpal for the communication between fragments and arrangements (see [penpal](https://github.com/Aaronius/penpal#readme))

## Structure of the Repository

The structure of the repository is as follows.
In each folder, you will find a documenting markdown file explaining the details of the respective part.

```md
collage/
|-- .github/          // github actions configurations
|-- docs/             // user documentation built with vuepress
|-- e2e/              // our e2e tests
|-- src/              // source code
|   |-- core/         // core concepts of collage implemented as collage plugins
|   |-- elements/     // custom elements for a convenient usage of collage
|   |-- lib/          // internal library structure of collage
|   |   |-- api/      // collage api 

```

- [core](./core/CORE_CONCEPTS.md)
- [elements](./elements/README.md)
- [lib](./lib/README.md)

## Architecture

Collage is build as a plugin library. Each basic feature is defined as a plugin. All default plugins are configured and bootstrapped together.

How this is done, you can read in the documentation about the [internal structure of the collage library](./lib/README.md).

In short:

- all types, and everything needed to put collage and the plugins together can be found in lib.
- everything that implements functionality for the user is a plugin and can be found in core.

## Contributing

Every contribution is welcome, as we want to make collage a vivid community project.

At the moment we lack a system to enable plugins dynamically, so each plugin must be built and bundled with the library. We are evaluating to change that in the future, so everybody could add functionality to collage.

### Creating a new plugin/feature

#### Workflow

1. create the plugin
   1. create a new folder in the src/core directory
   1. create a plugin file as ts (orient at the core plugins)
   1. create a samples folder for integration testing examples
1. create tests
   1. create e2e test for the new feature
   1. create unit tests in the plugin folder
1. create documentation
   1. create a documentation file as md if necessary
1. add the plugin to collage
   1. import the plugin
   1. add to the plugins array

#### How a plugin is made

With a plugin, you are able to enhance collage by new features.
For an example of a minimal plugin, please have a look at the [create-context](./core/create-context/create-context.ts).

In short, a valid plugin needs to export the default function `plugin` where it can pass an object, that uses the PluginFunctions to enhance collage by the new features (see [src/types.ts>PluginFunctions](./types.ts) and [collage-plugin](./lib/collage-plugin.ts)).

```ts
import plugin from '../../lib/collage-plugin';

export default plugin({
  enhanceExpose: async () => {
    console.log('I send a message everytime expose() is called');
  },
});
```

## Core Concepts

Read further in the [Core Concepts Documentation](./core/CORE_CONCEPTS.md)
