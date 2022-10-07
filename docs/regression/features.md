# Formal Definition of Features

This is a list of all notable Collage features, described in a testable and explicit language.

## Service Calls

Collage fragments should be able to expose and call service functions. 

```gherkin
 Given a fragment exposes a service
  When the fragment calls the service on the context api
  Then it should perform the previously exposed function
```


When embedded in arrangements, those service functions should be able to be overwritten by the arrangement.

```gherkin
 Given an arrangement embeds a fragment
   And both expose the same service function
  When the embedded fragment calls the service function
  Then it should perform the function exposed by the arrangement
```


## Rest

- direct functions andcalling them on named embedded fragments
- topic usage
- versioned services
- fragment configuration
- theming (?)
- expose provides ContextApi
- error on unknown service
- error on service withmissing own implementation



**Why?**

- Should add services of children to own context when child is registered on expose


**How?**

- topics as part of services or as own type?
- maybe even _implicit_ topics (analogous to MQTT)?
- service implementation overwrite order?
- rename services -> features?
