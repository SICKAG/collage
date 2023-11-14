# Create Context
The most basic concept in collage is that of a context. As its base a context is simply the representation of a uniquely identified fragment and the connection to a potential parent.

This takes no argument.

And creates the following context api:

```javascript
{
  // unique (uuidv4) context id
  id: 'xxxx-xxxx-xxxx-xxxx'

  // wether we are embedded in another arrangement
  hasArrangement: true || false
}
```
