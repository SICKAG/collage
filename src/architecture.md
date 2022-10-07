# Core Architecture

## Module Structure

```javascript
connectArrangement() {
  
  serviceFunctions() {
    const definition = {
      services: { foo() }
    }
    
    const context = createContext(definition) {
      return { id, parentOrigin }
    }

    return { ...context, services }
  }
}
```


##  Modules

### 1. Create Context

#### Description

**In:**
```javascript
{}
```

**Out:**
```javascript
{}
```


#### Context

**In:**
```javascript
{}
```

**Out:**
```javascript
{
  id: '1234-1234-1234',
  arrangementOrigin: 'http://some.server'
}
```



