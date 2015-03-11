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
 * @param {Object} checkModule
 * @param {Array} parentModule
 * @returns {String}
 */
function convertString(dirname, color, str, childs, indent, checkModule, parentModule) {
  indent = indent || '';
  checkModule = checkModule || {};
  parentModule = parentModule || [];
  var key,
      last = Object.keys(childs).pop(),
      currIndent,
      nextIndent,
      nextParentModule;

  for (key in childs) {
    if (key === last) {
      currIndent = indent + '\u2514\u2500\u2500 ';
      nextIndent = indent + '    ';
    } else {
      currIndent = indent + '\u251C\u2500\u2500 ';
      nextIndent = indent + '\u2502   ';
    }

    if (key.indexOf(DYNAMIC_LOADING) === 0) {
      key = DYNAMIC_LOADING + '  code=> ' + childs[key];
      if (color) {
        str += currIndent + COLOR.YELLOW + key + COLOR.RESET + '\n';
      } else {
        str += currIndent + key + '\n';
      }
      continue;
    }

    if (/^\w/.test(key)) {
      if (color) {
        str += currIndent + COLOR.MAGENTA + key + COLOR.RESET + '\n';
      } else {
        str += currIndent + key + '\n';
      }
      continue;
    }

    if (~parentModule.indexOf(key)) {
      if (color) {
        str += currIndent + COLOR.RED + path.relative(dirname, key) + COLOR.RESET + '\n';
      } else {
        str += currIndent + path.relative(dirname, key) + '\n';
      }
      continue;
    }

    if (checkModule[key]) {
      if (color) {
        str += currIndent + COLOR.CYAN + path.relative(dirname, key) + COLOR.RESET + '\n';
      } else {
        str += currIndent + path.relative(dirname, key) + '\n';
      }
      continue;
    }

    if (childs[key]) {
      str += currIndent + path.relative(dirname, key) + '\n';
      checkModule[key] = true;
      nextParentModule = parentModule.slice();
      nextParentModule.push(key);
      str = convertString(dirname, color, str, childs[key], nextIndent, checkModule, nextParentModule);
    } else if (color) {
      str += currIndent + COLOR.GREEN + path.relative(dirname, key) + COLOR.RESET + '\n';
    } else {
      str += currIndent + path.relative(dirname, key) + '\n';
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
