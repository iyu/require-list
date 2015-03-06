/**
 * @fileOverview node require tree
 * @name index.js
 * @author Yuhei Aihara <yu.e.yu.4119@gmail.com>
 * @license MIT license
 */
'use strict';
var fs = require('fs'),
    path = require('path');

var esprima = require('esprima');

function findRequire(est) {
  if (est.type === esprima.Syntax.CallExpression &&
      est.callee &&
      est.callee.type === esprima.Syntax.Identifier &&
      est.callee.name === 'require' &&
      est.arguments && est.arguments.length) { 
    
    return [ est.arguments[0].value ];
  }

  var key, result = [], _result;
  for (key in est) {
    if (est[key] && typeof est[key] === 'object') {
      _result = findRequire(est[key]);
      Array.prototype.push.apply(result, _result);
    }
  }

  return result;
}

function childTree(filepath, level) {
  if (level > 10) {
    return {};
  }

  var result = {};
  var code = fs.readFileSync(filepath, 'utf8');
  code = code.replace(/^#\!.*\n/, '');
  var est;
  try {
    est = esprima.parse(code);
  } catch (e) {
    console.error(filepath);
    throw e;
  }

  var childs = findRequire(est);
  var i = 0, len = childs.length, child;
  for (i; i < len; i++) {
    child = childs[i];
    if (/^\w/.test(child)) {
      // core module
      result[child] = null;
      continue;
    }

    child = require.resolve(path.resolve(path.dirname(filepath), child));
    if (path.extname(child) !== '.js') {
      result[child] = null;
      continue;
    }
    result[child] = childTree(child, level + 1);
  }

  return result;
}

function convertString(dirname, color, str, childs, level) {
  var i, key;
  var indent = '';
  for (i = 0; i < level; i++) {
    indent += '   |';
  }
  indent += '   ├─ ';

  for (key in childs) {
    if (/^\w/.test(key)) {
      if (color) {
        str += indent + '\u001b[35m' + key + '\u001b[0m\n';
      } else {
        str += indent + key + '\n';
      }
      continue;
    }

    if (childs[key]) {
      str += indent + path.relative(dirname, key) + '\n';
      str = convertString(dirname, color, str, childs[key], level + 1);
    } else if (color) {
      str += indent + '\u001b[32m' + path.relative(dirname, key) + '\u001b[0m\n';
    } else {
      str += indent + path.relative(dirname, key) + '\n';
    }
  }

  return str;
}

module.exports = function requireList(entrypoint) {
  return childTree(path.resolve(entrypoint), 0);
};

module.exports.string = function string(entrypoint, color) {
  entrypoint = path.resolve(entrypoint);
  var tree = module.exports(entrypoint);
  var str = entrypoint + '\n';
  return convertString(path.dirname(entrypoint), color, str, tree, 0);
};
