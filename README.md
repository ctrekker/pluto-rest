# pluto-rest
A JavaScript interface for the Pluto.jl \"What you see is what you REST\" web API.

## Installation
```
npm install pluto-rest
```

## Usage
The following example is based off the REST Docs.jl Pluto notebook. Also note that this example must be wrapped in an [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).
```javascript
const { PlutoNotebook } = require('pluto-rest')

const nb = new PlutoNotebook('REST Docs.jl')

// Evaluation
console.log(await nb.c)  // prints 5
console.log(await nb({a: 5, b: 12}).c)  // prints 13

// Calling functions
console.log(await (await nb.distance)(3, 4, 12))  // prints 13 
```
