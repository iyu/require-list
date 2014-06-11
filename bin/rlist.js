#!/usr/bin/env node
var path = require('path');

var commander = require('commander');

var package = require('../package');

commander
  .version(package.version)
  .usage('[options] -e <file>')
  .option('-e, --entry <file>', 'entry point')
  .option('-a, --argv <argv>', 'entry argv')
  .option('-w, --wait <time>', 'wait time (ms)')
  .parse(process.argv);


if (!commander.entry) {
  console.log('please specify entry point: -e --entry <file>');
  process.exit(2);
}
commander.argv = commander.argv || '';
commander.wait = commander.wait || 0;

var entry = path.resolve(process.cwd(), commander.entry);
var argv = [ 'node', entry ].concat(commander.argv.split(' '));
var wait = Number(commander.wait);

process.argv = argv;
require(entry);

function output() {

  // entry point
  var entryDir = path.dirname(entry);
  console.log(entry.replace(entryDir, '.'));

  function childTree(children, level) {
    var i, len;
    var space = '';
    for (i = 0; i < level; i++) {
      space += '   |';
    }
    space += '   ├─';

    for (i = 0, len = children.length; i < len; i++) {
      var filePath = children[i].id.replace(entryDir, '.');
      if (/node_modules/.test(filePath)) {
        continue;
      }
      console.log(space, filePath);
      if (children[i].children.length) {
        childTree(children[i].children, level + 1);
      }
    }
  }

  var children = require.cache[entry].children;
  childTree(children, 0);
}

setTimeout(function() {
  output();
  process.exit(0);
}, wait);
