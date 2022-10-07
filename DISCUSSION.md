# So, about this thing...

Use this file to gather open points and stuff we have to keep in mind or haven't
fully clarified yet.

[toc]

## Location of topics

In the initial draft, topics are part of the describion in a specific service.

I would like to see some arguments for that since as far as I see it, this is
unneccessary complexity. 

If we were to define topics only at the basis of the expose object, they would
have the same visibility as services and functions. That way we could argue 
about Collage having the possibility to _manage communication via direct 
functions, services and topics_ without having to argue about topics being a 
possible part of a service.


Thoughts?

-- josh


## CSS Themeing

The initial draft has a CSS theming functionality that alters css variables 
behind the scenes.

Although I understand the motivation of keeping this implicit, my intuition is
somehow still that (at least for the core library) we should make that
explicit or not even bother adding the additional functionality at all.

At the moment I am kind of leaning towards the idea, that theming concerns 
could maybe handled via a special topic that all interested parties could then
subscribe to.

In that way, we could create a Collage-theming library that could:
- register a `changeCssProperty` function at the context which publishes the new
  value onto the theming topic
- and register a topic listener in every child that uses the library which 
  changes the css property in the `:root` of the specific frontend using it.

We could even integrate that second library as default in the SICK context,
making the whole functionality implicit again for every micro fronend that uses
the SICK library.

-- josh


### Assumptions needed for implicit css theming

- the css of most (all?) relevant `Fragments` is handled with effective
  theming css variables on the root level (`:root`)
- all `Fragments` in the `arrangement` use the same variable names for theming
- those variables have the same or similar effective outcome when changed. E.g.
  a `--background-color` being set to a certain new value behaves visually 
  consistent on all `Fragments`
- `Fragments` that are part of the `arrangement` will NEVER change unexpectedly 
  as partains to said visual coherence. This includes that parts of the 
  `arrangement` will have roughly the same update cycle for the commonly used 
  visual library
- parts of the `arrangement` will never be used in a different coontext, where a 
  different semantic is used for visual theming
- it is reasonable for all `Fragments` in the `arrangement` to have css values
  rewritten on the DOM from the outside. e.g. no magic virtualDom shenanigans
  happen that make that manipulation unaffective
- manipulating the DOM in this way does not cause side effects in the child
  `Fragment`. (events being fired, mutation observers going off, etc.)


### Use cases

- Theming a whole application while maintaining a coherent look
- adopting a theme to micro frontends that get embeded after the fact

Because of the assumption of visual coherence, css theming through Collage will
most likely only be viable in a scenario where all parts of the collage are 
_known code_ or at least built with the same, known visual library and there is
no intention of using parts of that application in other collages where 
different ui and theming code may be in use.


### Possibilities


* us a **common set of themes** and use config settings and a topic for 
  switching between them
* use the config to set a set of css variables and **integrate on the child**
  in an explicit function to init theme values. Use some other existing
  communications channel (services, topics) to trigger updates later on if
  needed. -- this version could even be made as a Collage plugin, where some
  form of css-variable contract is handled implicitely again



## Differences between Core and SICK

As we intend to open source a core api of the Collage we will have to decide on
which concepts will become part of that api and which concepts will stay in a
seperate SICK-specific library.

- Service Versions?
- Services to Profile to Services convertion?
- Implizit CSS theming?
- renaming the custom element that embeds children?

