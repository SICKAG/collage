# Services
The services feature allows an easy way to do a communication via a request response mechanism.

If several fragments will use the same service, the service implementation of the topmost arrangement will be used.

## Registering of Services

1. On expose(), every context registers its services in the "services" property.
    1. When the handshake is done, the top-most arrangement sends its services to all its fragments in the response to penpal-connect-to arrangement.
    1. When a fragment gets services sent from its arrangement, it registers them in the "branchServices" property of its context
    1. The fragment sends its services merged with its branchServices to all of its own fragments
1. On updateContext(), a context triggers the "reinitialize" function on all of its children and the services get synched again.

## Calling of Services

```mermaid
sequenceDiagram
  participant Arrangement
  participant Fragment
  
  Arrangement ->> Arrangement: expose(services)
  Fragment ->> Fragment: expose(services)

  Fragment ->> Fragment: service-is-executed
  activate Fragment
  Fragment ->> Fragment: callServiceWorkflow(service)
  alt if service is in branchServices
      Fragment ->> Arrangement: callService(service)
      Arrangement ->> Arrangement: callServiceWorkflow(service)
      Arrangement ->> Arrangement: service()
      Arrangement ->> Fragment:  response-of-service
      deactivate Fragment
  else else
      Fragment ->> Fragment: service()
  end

```
