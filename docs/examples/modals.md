# Handling Modal State


## Modal Fragment as confirm dialog

Lets asume that an Arrangement application wants to give the stage to a certain Fragment application for some specific user interaction.

The Arrangement will want to
 * Present the fragment in it's styling front and center (as a modal or something similar)
 * Communicate to the fragment, that it should present a specific UI
 * Await the finished user interaction on the fragment and
   - reset the styling
   - collect data that resulted from the user interaction

Or to put it more simple: An Arrangement may want to use a fragment like a `window.confirm()` dialog.


### Arrangement

:::: code-group
::: code-group-item index.html
```html
<body>
  <button data-trigger="ask-the-oracle">Ask the question</button>
  <collage-fragment url="/oracle" name="oracle"></collage-fragment>
  <span class="answer">...</span>
</body>
```
:::
::: code-group-item style.css
```css
.front-and-center {
  position: absolute;
  left: 10vw;
  right: 10vw;
  top: 10vh;
  bottom: 10vh;
}
```
:::
::: code-group-item code.js
```javascript
import { expose } from collage

const { children: oracle } = expose()

document.addEventListener('click', async ({ target }) => {
  if (target.closest('[data-trigger=ask-the-oracle]')) {
    const fragment = document.querySelector('collage-fragment[name=oracle]')
    fragment.classList.toggle('front-and-center', true)

    const answer = await oracle.ask()

    document.querySelector('.answer').textContent = answer
    fragment.classList.toggle('front-and-center', false)
  }
})
```
:::
::::


### Fragment

:::: code-group
::: code-group-item index.html
```html
<body>
  <header>
  I <em>AM</em> mysterious!
  </header>
  <main>
  <div>
    <label>
      What is it you want?
      <input name="question">
    </label>
    <button>OK</button>
  </div>
  <span class="answer"></span>
  </main>
</body>
```
:::
::: code-group-item code.js
```javascript
document.addEventListener('click', ({ target }) => {
  if (target.closest('button')) {
    document.querySelector('.answer').textContent = 'Interesting...'
    document.querySelector('input').value = ''
  }
})

await expose({
  functions: {
    ask() {
      const questionAsked = new Promise()
      document.addEventListener('click', ({ target }) => {
        if (target.closest('button')) {
          setTimeout(() => questionAsked.resolve(), 1000)
        }
      }
      return questionAsked
    }
  }
})
```
:::
::::


## Fragments asking to become modal

When the user interaction within a Fragment has let to a state where it needs
to become modal within the surrounding Arrangement.

::: tip Alpha Note
While the following will work with the current state of the library, Collage 
itself is still considered **alpha** and the functionality and api described 
here is bound to improove in later versions.
:::

Since the embedded fragment will be the one to initiate the state change to the
arrangement, it should propably call a service to communicate that intention.

:::: code-group
::: code-group-item fragment.js
```javascript
const { services: { modal }, id } = await expose({
  services: {
    modal: {
      set(fragmentId) {/* empty default */}
      unset(fragmentId) {/* empty default */}
    }
  }
})

// some time later...

await modal.set(id)

//do whatever you need to

await modal.unset(id)
```
:::
::: code-group-item arrangement.js
```javascript
function triggerFragmentModal(id, force) {
  findFragmentElement({ id }).classList.trigger('front-and-center', force)
}

await expose({
  services: {
    modal: {
      set (id) {
        triggerFragmentModal(id, true)
      }
      unset (id) {
        triggerFragmentModal(id, false)
      }
    }
  }
})
```
:::
::::
