# Your first Collage Project

To wet your appetite and give you a feeling for the Collage library, **let's create a simple todo list as a micro frontend and integrate it within a larger application** where a user can choose backlog items as their own todos or promote personal todos as backlog items.

> **Micro Frontend**
>
> A micro frontend is a small dedicated frontend application that serves a
> specific purpose independend from other parts of a greater application.
>
> The term [micro frontends](https://micro-frontends.org/) is relatively new. The
> gist however is, that frontends can serve smaller purposes and assemble into
> a greater whole with better separation of complexity.
>
> **Collage** is a library which aims to facilitate communication between such
> micro frontends via _Services_, _Topics_, _Function Calls_ and _Configuration_
> backed by modern standard browser technologies.
>
> In Collage, we call a micro frontend a [**fragment**](/docs/concepts.html#fragment) and the combination of micro frontends an [**arrangement**](/docs/concepts.html#arrangement)

## Setup

Let's get started by quickly creating two separate frontend applications and adding the Collage library to them.

```bash
npm init vite@latest dashboard -- --template vanilla
npm init vite@latest todos -- --template vanilla
```

Vite just created you two separate projects containing everything you need to develop a nice little web application. Now cd into the newly created project directories and install **Collage**

```bash
cd dashboard
npm i @sick-davinci/collage

cd ../todos
npm i @sick-davinci/collage
```

::: tip
While we are using a _vanilla-js_ setup here, based on [Vite](https://vitejs.dev/) for an easy quickstart, **Collage is build on standard browser features and can be used in just about any tech stack.**
:::

## Coding an example Application

### The Todos App

We start by creating a simple application where a user can enter todo items and solve them later.

The application might look something like the following:

:::: code-group
::: code-group-item todos/index.html

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Todos</title>
    <script type="module" src="./main.js"></script>
  </head>
  <body>
    <ul>
      <li id="add-todo">
        <form action="#">
          <input placeholder="Learn to use Collage" name="new-todo" />
          <input type="submit" value="Add" />
        </form>
      </li>
    </ul>
  </body>
</html>
```

:::
::: code-group-item todos/main.js

```javascript
function addTodoItem(text) {
  if (!text) return;

  const item = document.createElement("li");
  item.innerHTML = `<label><input type="checkbox">${text}</label>`;
  document.querySelector("#add-todo").before(item);
}

document.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("[name=new-todo]");
  addTodoItem(input.value);
  input.value = "";
});
```

:::
::::

::: tip
Just overwrite the main.js file, vite created for you [earlier](#setup).
:::

### The Dashboard App

In a similar fashion, let's create a dashboard application that presents a
set of issue items.

:::: code-group
::: code-group-item dashboard/index.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>Issues Dashboard</title>
  <script src="./main.js" type="module"></script>
</head>
<body>
  <main>
    <details>
      <summary>Something</summary>
      This is a thing that needs doing
    </details>
    <details>
      <summary>Something else</summary>
      Also a doable thing
    </details>
    <details>
      <summary>Another thing</summary>
      While we are not yet sure how, we will definitely need to do this thing
      as well.
    </details>
    <details>
      <summary>Bananas</summary>
      Very important!
    </details>
  </main>
</body>
</html>
```

:::
::: code-group-item dashboard/main.js

```javascript
// there's nothing here yet...
```

:::
::::

::: tip
Here as well, just overwrite the main.js file, vite created for you [earlier](#setup).
:::

## Arranging the pieces with Collage

While our two applications are cleary extremely useful and well designed on their own right now, let us see what happens, when we put them together in an
**arrangement**, using **Collage**.

### Include Collage into your Apps

Every Collage fragment starts by describing its capabilities with the
`expose()` function.
For now we just promote the Todos App and the Dashboard App to fragments by calling expose() without a description. We will add some interaction later. The Dashboard App also must be a fragment to be able to embed other fragments.

:::: code-group
::: code-group-item todos/main.js

```javascript{2-3}
// Import and call the expose() function
import { expose } from '@sick-davinci/collage'
expose()

function addTodoItem(text) {
// nothing changed
}

document.addEventListener('submit', event => {
// here neither
})
```

:::
::: code-group-item dashboard/main.js

```javascript{2-3}
// Import and call the expose() function
import { expose } from '@sick-davinci/collage'
expose()

// nothing else to do for now
```

:::
::::

:::tip
Fragments which are embedding other fragments are called arrangements.
:::

### Embed the Todos Fragment into the Dashboard App

Now that we have two beautiful fragments, lets create an arrangement of both.
Just use the `<collage-fragment>` tag to embed the Todo fragment into the Dashboard fragment.

:::: code-group
::: code-group-item dashboard/index.html

```html{16-19}
<!DOCTYPE html>
<html>
  <head>
    <title>Issues Dashboard</title>
    <script src="./main.js" type="module"></script>
  </head>
  <body>
    <main>
      ...
      <!-- nothing changed here -->
    </main>
    <aside>
      <!--
        add the todos app as a fragment inside this arrangement and give it
        a name for identification
      -->
      <collage-fragment
        url="http://localhost:4000/"
        name="todos">
      </collage-fragment>
    </aside>
  </body>
</html>
```

::::

Now you can crank up an http-server to serve your application and try it out.
:::tip
Take care to serve all of your application, not just the dashboard app, otherwise the route for the Todos fragment will not be resolved.
:::

### Add some interaction

Ok, now we integrated the Todo App into the Dashboard app like an iframe.
But the really interesting part comes when we add some interaction between both fragments.

To do so, we first describe the capabilities of both the Dashboard and the Todo fragment to define how one can interact with them. In our case we describe a service-level topic to post our active todos to and
a function that others can call on us directly, to add a todo item.

The returned promise resolves into the [**Collage Context**](/docs/concepts.html#context), which gives us
access to functionality that is defined within our arrangement by a [**Frontend Description Object**](/docs/core-api.html#frontend-description).
Here we will need the [**Topics API**](/docs/core-api.html#topics-api) specifically, to publish the currently active todo items.
:::: code-group
::: code-group-item todos/main.js

```javascript{1-11,18-23,34,45}
import { expose } from '@sick-davinci/collage'
const context = await expose({
  services: {
    todos: {
      topics: ['active']
    }
  },
  functions: {
    addTodoItem
  }
})

function publishActiveTodos() {
  // The topic api provides `publish` and `subscribe` methods to each defined
  // topic.
  // We use that to publish an array of all todo items that are not already
  // checked off.
  context.topics.todos.active.publish(
    [...document.querySelectorAll('[type=checkbox]')]
      .filter(({checked}) => !checked)
      .map(input => input.closest('label'))
      .map(label => label.textContent)
  )
}

function addTodoItem(text) {
  if (!text) return

  const item = document.createElement('li')
  item.innerHTML = `<label><input type="checkbox">${text}</label>`
  document.querySelector('#add-todo').before(item)

  // re-publish the active items, since they have changed
  publishActiveTodos()
}

document.addEventListener('submit', event => {
  event.preventDefault()
  const input = document.querySelector('[name=new-todo]')
  addTodoItem(input.value)
  input.value = ''
})

// re-publish the active items, since they have changed
document.addEventListener('change', publishActiveTodos)

```

:::

::: code-group-item todos/index.html

```html
<!DOCTYPE html>
<!-- 
  Nothing changed here.
-->
<html>
  <head>
    <title>Todos</title>
    <script type="module" src="./main.js"></script>
  </head>
  <body>
    <ul>
      <li id="add-todo">
        <form action="#">
          <input placeholder="Learn to use Collage" name="new-todo" />
          <input type="submit" value="Add" />
        </form>
      </li>
    </ul>
  </body>
</html>
```

:::

::::
:::tip
You can read more about the [Collage Context API](/docs/core-api.html#context-api) and the [Collage Topics API](/docs/core-api.html#topics-api) in our [API documentation](/docs/core-api.html)
:::

Now we describe the Dashboard fragment and add some Buttons for creating todos in the Todo fragment.
Here as well, we expose our capabilities and use the resulting context for interaction.

In this case we would like to have access to the todos 'active' topic and to the direct functions on the fragment we called 'todos' in our DOM.

:::: code-group
::: code-group-item dashboard/main.js

```javascript{1-11,15,23}
import { expose } from '@sick-davinci/collage'
const context = await expose({
  services: {
    todos: {
      topics: ['active']
    }
  }
})

const activeTodos = context.topics.todos.active;

// whenever the active todos change, we want to react to that and disable the
// 'add-todo' buttons on the issues matching those
activeTodos.subscribe(todos => {
  for (const details of [...document.querySelectorAll('details')]) {
    const summary = details.querySelector('summary')
    const button = details.querySelector('[data-action=add-todo]')
    button.disabled = todos.includes(summary.textContent)
  }
})

document.addEventListener('click', ({target}) => {
  if (target.closest('[data-action=add-todo]')) {
    const name = target.closest('details').querySelector('summary').textContent

    // since we added a name to the 'davinci-fragment' in our DOM, we can refer
    // directly to functions declared on that fragment.
    context.fragments.functions.todos.addTodoItem(name)
  }
})
```

:::
::: code-group-item dashboard/index.html

```html{11,12,17,23,28}
<!DOCTYPE html>
<html>
  <head>
    <title>Issues Dashboard</title>
    <script src="./main.js" type="module"></script>
  </head>
  <body>
    <main>
      <details>
        <summary>Something</summary>
        This is a thing that needs doing
        <!-- add a button, so that we can send something to the todos app -->
        <button data-action="add-todo">Todo</button>
      </details>
      <details>
        <summary>Something else</summary>
        Also a doable thing
        <button data-action="add-todo">Todo</button>
      </details>
      <details>
        <summary>Another thing</summary>
        While we are not yet sure how, we will definitely need to do this thing
        as well.
        <button data-action="add-todo">Todo</button>
      </details>
      <details>
        <summary>Bananas</summary>
        Very important!
        <button data-action="add-todo">Todo</button>
      </details>
    </main>
    <aside>
      <!--
        define the todos app as a fragment inside this arrangement and set 
        the url to a location we can access the fragment.
        Also give it a name we can reference it.
      -->
      <collage-fragment
        url="http://localhost:4000/"
        name="todos">
      </collage-fragment>
    </aside>
  </body>
</html>
```

:::
::::

Voila, you just have created your first application using Collage.
Now serve both, the Todos fragment (at port 4000) and the Dashboard arrangement by using the vite dev server:

```bash
npm run dev

cd ../todos

npm run dev --port 4000
```

:::tip
If you want to learn more about the [concepts](/docs/concepts/) and [features](/docs/features/) or the [API](/docs/core-api/) of Collage, please have a look at our Docs.
:::
