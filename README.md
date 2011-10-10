# querify

The query interpreter used in [pubsub.io](http://pubsub.io). It's available through npm:

`npm install querify`

Using querify is easy

``` js
var querify = require('querify');

var query = querify.compile({a:1});

console.log(query({a:1})) // true
console.log(query({a:2})) // false
```

More examples to come!