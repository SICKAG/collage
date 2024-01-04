---
home: true
actions:
  - text: Getting Started
    link: /guide/getting-started
    type: primary
  - text: Core Api
    link: /docs/core-api
    type: secondary
features:
  - title: Framework Agnostic
    details: Write your micro frontends and applications in vanilla js or with the frameworks you like - Collage will work with all of them
  - title: Easy to use
    details: With Collage, every Web Application can be upgraded to a micro frontend with just two lines of code
  - title: Rock Solid
    details: Built on web standards and only a few simple core concepts means that you never run into magic behaviour that ruins your day.

#
  # TODO: add this claim as soon as DAVIAF-109 is done
  # - title: Seamlessly Integratable
  #   details: Style your application - Collage synchronzes the styles so the micro frontends you integrate fit in perfectly


---
## What`s in it for me?
Create an application that consists of different micro frontends
- which can be developed in completely independent and autonomously working teams
- that already existed as non-micro frontends before, but are extended to be reused as micro frontends
- which have their own scope and are isolated and therefore do not affect others


<br>


:::: code-group
::: code-group-item html

```html{4-8}
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

:::
::: code-group-item js

```javascript
const api = await expose({
  // expose the api of your micro frontend
  services: {
    myService(name = "") {
      return `Default Implementation for ${name}`;
    },
  },
});
```
:::
::::

## Installation

```bash
npm install @collage/core
```
