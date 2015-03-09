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

var DYNAMIC_LOADING = 'Dynamic loading';
var COLOR = {
    BLACK: '\u001b[30m',
    RED: '\u001b[31m',
    GREEN: '\u001b[32m',
    YELLOW: '\u001b[33m',
    BLUE: '\u001b[34m',
    MAGENTA: '\u001b[35m',
    CYAN: '\u001b[36m',
    WHITE: '\u001b[37m',

    RESET: '\u001b[0m'
};

function findRequire(est) {
  if (est.type === esprima.Syntax.CallExpression &&
      est.callee &&
      est.callee.type === esprima.Syntax.Identifier &&
      est.callee.name === 'require' &&
      est.arguments && est.arguments.length) { 
    
    if (est.arguments[0].type === esprima.Syntax.Literal) {
      return [ est.arguments[0].value ];
    } else {
      return [ DYNAMIC_LOADING ];
    }
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
    if (key === DYNAMIC_LOADING) {
      if (color) {
        str += indent + COLOR.YELLOW + key + COLOR.RESET + '\n';
      } else {
        str += indent + key + '\n';
      }
      continue;
    }

    if (/^\w/.test(key)) {
      if (color) {
        str += indent + COLOR.MAGENTA + key + COLOR.RESET + '\n';
      } else {
        str += indent + key + '\n';
      }
      continue;
    }

    if (childs[key]) {
      str += indent + path.relative(dirname, key) + '\n';
      str = convertString(dirname, color, str, childs[key], level + 1);
    } else if (color) {
      str += indent + COLOR.GREEN + path.relative(dirname, key) + COLOR.RESET + '\n';
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
