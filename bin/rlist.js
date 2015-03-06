#!/usr/bin/env node
var fs = require('fs');
var path = require('path');

var requireTree = require('../');

var input = process.argv[2];
var version = require('../package').version;

if (!input) {
  console.error('Error parsing command line: not found option');
  console.error('try \'rlist --help\' for more information');
  process.exit(1);
}

if (fs.existsSync(path.resolve(input))) {
  console.log(requireTree.string(input, true));
  process.exit(0);
}

if (input === '--version' || input === 'version') {
  console.log(version);
  process.exit(0);
}

if (input === '--help' || input === 'help') {
  console.log('Usage: rlist [JavaScript file path in entry-point]');
  console.log('Options:');
  console.log('  --version, version\tshow version');
  process.exit(0);
}

console.error('Error parsing command line: unknown option', input);
console.error('try \'rlist --help\' for more information');
process.exit(1);
