# Edge case testing

There are some _special_ scenarios to consider with a library that manages communication between different frontends, potentially on different url origins.

A few of those are considered her.

To run the tests, start the dev servers with `npm run start:edge`. This will generate three different servers:

* `localhost:8080` - the _default_ and main server which will forward (rewrite) any unknown requests to `localhost:8082`
* `localhost:8081` - a normal dev server without any forwarding
* `localhost:8082` - a pure redirect server. This server will take any request, remove a potential `/redirect` from the url and then redirect to the new url on server `localhost:8081` with a `301` redirect.

Using this setup, you can now run all the numbered test files from the `localhost:8080` server origin.


## Thoughts 'n stuff

### About **error handling paradigm**:

We want to be resiliant for errors that happen on handshake. Meaning that our main goal should be, not to disrupt the consistent look&feel for the user.
To that end, we will provide a hook where a developer can attach an onFail listener and do their own error handling (or simply attach `console.error` to log whats happening) but we will neither try to block the iframe loading, nor erase the iframe content if collage could not initialize.

If collage was not able to initialize the arrangement or one of the fragments in an arrangement, the failing micro frontend should be treated, as if it had no collage context but was a simple iframe integration.

To that end, we will also invert the way that we do handshakes: We do NOT force the browser to wait until collage initializes. Rather we will act analogous to majer frameworks that _rehydrate_ a DOM: We will attach collage functionality after the fact.

#### Theming

There is one scenario in which we would (maybe?) want to block rendering until collage is initialized and that is theming. Reason being that we would want to avoid FOUC. Or even worse, have styled content inside a client fragment change styling after initialization.

> _not quite sure how to mary both concerns!_


### Conclusion

Since FOUC can only happen in a collage arrangement (since otherwise no restyling happens) it should be sufficiant to refactor the `hasParent` function such that it 1. finishes **fast** (shorter than 25ms would be preferable, since that is lower than the human sensitivity for concurency) and 2. **only** returns `true` when there actuallyis a collage arrangement as parent present.



