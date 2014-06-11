Require List
==========

Required children tree.

## Installation
```
npm install -g require-list
```

## Command
### rlist
#### Example
##### Case 1
a.js
```
require('./b');
console.log('done: a');
```
b.js
```
require('./c');
console.log('done: b');
```
c.js
```
console.log('done: c');
```

command
```
$ rlist -e a.js
done: c
done: b
done: a
./a.js
   ├─ ./b.js
   |   ├─ ./c.js
```
##### Case 2
a.js
```
setTimeout(function() {
  require('./b');
}, 1000);
console.log('done: a');
```
b.js
```
require('./c');
console.log('done: b');
```
c.js
```
console.log('done: c');
```

bad command
```
$ rlist -e a.js
done: a
./a.js
```
good command
```
$ rlist -e a.js -w 1000
done: a
done: c
done: b
./a.js
   ├─ ./b.js
   |   ├─ ./c.js
```
##### Case 3
a.js
```
if (process.argv.length < 4) {
  console.log('unknown option "-c --config <path>"');
  process.exit(1);
}
require('./b');
console.log('done: a');
```
b.js
```
require('./c');
console.log('done: b');
```
c.js
```
console.log('done: c');
```

bad command
```
$ rlist -e a.js
unknown option "-c --config <path>"
```
good command
```
$ rlist -e a.js -a '-c conf/local.json'
done: c
done: b
done: a
./a.js
   ├─ ./b.js
   |   ├─ ./c.js
```

## Test
Run `npm test` and `npm run-script jshint`
