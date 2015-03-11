/**
 * @fileOverview node require tree
 * @name index.js
 * @author Yuhei Aihara <yu.e.yu.4119@gmail.com>
 * @license MIT license
 */
'use strict';
var fs = require('fs'),
    path = require('path');

var escodegen = require('escodegen'),
    esprima = require('esprima');

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
var DYNAMIC_LOADING = 'Dynamic loading';

/**
 * find require modules from AST
 * @param {AST} ast
 * @returns {Array}
 */
function findRequire(ast) {
  if (ast.type === esprima.Syntax.CallExpression &&
      ast.callee &&
      ast.callee.type === esprima.Syntax.Identifier &&
      ast.callee.name === 'require' &&
      ast.arguments && ast.arguments.length) { 
    
    if (ast.arguments[0].type === esprima.Syntax.Literal) {
      return [ ast.arguments[0].value ];
    } else {
      return [ DYNAMIC_LOADING + '_' + escodegen.generate(ast) ];
    }
  }

  var key, result = [], _result;
  for (key in ast) {
    if (ast[key] && typeof ast[key] === 'object') {
      _result = findRequire(ast[key]);
      Array.prototype.push.apply(result, _result);
    }
  }

  return result;
}

/**
 * generate require children tree
 * @param {String} filepath
 * @param {Number} depth
 * @returns {Object}
 */
function childTree(filepath, depth) {
  depth = depth || 0;
  if (depth > 10) {
    return {};
  }

  var result = {},
    code = fs.readFileSync(filepath, 'utf8').replace(/^#\!.*\n/, ''),
    ast;

  try {
    ast = esprima.parse(code);
  } catch (e) {
    console.error(filepath);
    throw e;
  }

  var childs = findRequire(ast),
      i,
      len,
      child,
      dcnt = 0;

  for (i = 0, len = childs.length; i < len; i++) {
    child = childs[i];
    if (child.indexOf(DYNAMIC_LOADING + '_') === 0) {
      // dynamic loading
      result[DYNAMIC_LOADING + '_' + dcnt] = child.replace(DYNAMIC_LOADING + '_', '');
      dcnt++;
      continue;
    }

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
    result[child] = childTree(child, depth + 1);
  }

  return result;
}

/**
 * convert string for output from childTree object
 * @param {String} dirname entry dirname
 * @param {Boolean} color use output color
 * @param {String} str output string
 * @param {Object} childs childTree return object
 * @param {String} indent
 * @returns {String}
 */
function convertString(dirname, color, str, childs, indent) {
  indent = indent || '';
  var key, last = Object.keys(childs).pop(), curr_indent, next_indent;

  for (key in childs) {
    if (key === last) {
      curr_indent = indent + '\u2514\u2500\u2500 ';
      next_indent = indent + '    ';
    } else {
      curr_indent = indent + '\u251C\u2500\u2500 ';
      next_indent = indent + '\u2502   ';
    }

    if (key.indexOf(DYNAMIC_LOADING) === 0) {
      key = DYNAMIC_LOADING + '  code=> ' + childs[key];
      if (color) {
        str += curr_indent + COLOR.YELLOW + key + COLOR.RESET + '\n';
      } else {
        str += curr_indent + key + '\n';
      }
      continue;
    }

    if (/^\w/.test(key)) {
      if (color) {
        str += curr_indent + COLOR.MAGENTA + key + COLOR.RESET + '\n';
      } else {
        str += curr_indent + key + '\n';
      }
      continue;
    }

    if (childs[key]) {
      str += curr_indent + path.relative(dirname, key) + '\n';
      str = convertString(dirname, color, str, childs[key], next_indent);
    } else if (color) {
      str += curr_indent + COLOR.GREEN + path.relative(dirname, key) + COLOR.RESET + '\n';
    } else {
      str += curr_indent + path.relative(dirname, key) + '\n';
    }
  }

  return str;
}

/**
 * @param {String} entrypoint
 */
module.exports = function requireList(entrypoint) {
  return childTree(path.resolve(entrypoint));
};

/**
 * @param {String} entrypoint
 * @param {Boolean} color
 */
module.exports.string = function string(entrypoint, color) {
  entrypoint = path.resolve(entrypoint);
  var tree = module.exports(entrypoint);
  var str = entrypoint + '\n';
  return convertString(path.dirname(entrypoint), color, str, tree);
};
