/* eslint-disable */
import { expose } from '/bundle/collage.js'

const { topics } = await expose({
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
  topics.todos.active.publish(
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

  publishActiveTodos()
}

document.addEventListener('submit', event => {
  event.preventDefault()
  const input = document.querySelector('[name=new-todo]')
  addTodoItem(input.value)
  input.value = ''
})

document.addEventListener('change', publishActiveTodos)
