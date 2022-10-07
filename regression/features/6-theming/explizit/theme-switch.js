function createStyle() {
  const style = document.createElement('style')
  style.dataset.collageActiveTheme = true
  document.head.appendChild(style)
  return style
}

export function setCssVariables(variables) {
  const style = document.querySelector('style[data-collage-active-theme]')
    || createStyle()
  
  style.innerHTML = `:root {
  ${Object.entries(variables)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n')}
  }`

  document.body.classList.toggle('theme-loaded', true)
}

export async function themable(expose, defaultTheme = {}) {
  const ctx = await expose({services: {
    theme: {
      values:() => defaultTheme,
      // topics: ['change']
    },
    themeChange: {
      topics: ['change']
    }
  }})
  const {services: {theme} , topics: {themeChange: {change}} } = ctx

  change.subscribe(setCssVariables)
  setCssVariables(await theme.values())

  return {
    changeStyling(variables) {
      change.publish(variables)
    } 
  }
}
