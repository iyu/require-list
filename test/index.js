var path = require('path');

var assert = require('power-assert'),
    rlist = require('../');

var testEntryPoint = './test/data/index.js';

describe('rlist', function() {
  it('#constructor', function() {
    var result = rlist(testEntryPoint);
    var expect = {};
    expect.path = null;
    expect.esprima = null;
    expect[path.join(__dirname, './data/a.js')] = {};
    expect[path.join(__dirname, './data/a.js')][path.join(__dirname, './data/b/index.js')] = {};
    expect[path.join(__dirname, './data/a.js')][path.join(__dirname, './data/b/index.js')][path.join(__dirname, './data/c.json')] = null;
    expect[path.join(__dirname, './data/a.js')][path.join(__dirname, './data/c.json')] = null;
    
    assert.deepEqual(result, expect);
  });

  it('#string', function() {
    var result = rlist.string(testEntryPoint);
    var expect = path.join(__dirname, './data/index.js') + '\n';
    expect += '├── path\n';
    expect += '├── esprima\n';
    expect += '└── a.js\n';
    expect += '    ├── b/index.js\n';
    expect += '    │   └── c.json\n';
    expect += '    └── c.json\n';

    assert.equal(result, expect);
  });
});
