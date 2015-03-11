Require List
==========

Required children tree.

## Installation
```
npm install -g require-list
```

## Usage
### Command
```
rlist [javascript file path in entry-point]
```
#### Example
/tmp/a.js
```javascript
var b = require('./b');
var test = require('./test');
```

/tmp/b.js
```javascript
require('./test/c');
module.exports = 'b';
```

/tmp/test/index.js
```javascript
require('./c');
```

/tmp/test/c.js
```javascript
module.exports = function() { return 'c' };
```

```
$ rlist /tmp/a.js
/tmp/a.js
   ├── b.js
   |   └── test/c.js
   └── test/index.js
       └── test/c.js
```

### Module API
#### Example
```javascript
var rlist = require('require-list');

console.log('rlist(filepath)');
console.log(rlist('/tmp/a.js'));

console.log('rlist.string(filepath)');
console.log(rlist.string('/tmp/a.js'));

// --output--
// rlist(filepath)
// { '/tmp/b.js': { '/tmp/test/c.js': {} },
//  '/tmp/test/index.js': { '/tmp/test/c.js': {} } } }

// rlist.string(filepath)
// /tmp/a.js
//    ├── b.js
//    |   └── test/c.js
//    └── test/index.js
//        └── test/c.js
```

## Contribution
1. Fork it ( [https://github.com/iyu/require-list/fork](https://github.com/iyu/require-list/fork) )
2. Create a feature branch
3. Commit your changes
4. Rebase your local changes against the master branch
5. Run test suite with the `npm test; npm run jshint` command and confirm that it passes
5. Create new Pull Request
