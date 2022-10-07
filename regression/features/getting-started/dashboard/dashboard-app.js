/* eslint-disable */

import { expose } from '/bundle/collage.js'

const { 
  children: { todos },
  topics: { todos: { active: activeTodos }}
} = await expose({
  services: {
    todos: {
      topics: ['active']
    }
  }
})

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
    todos.addTodoItem(name)
  }
})
