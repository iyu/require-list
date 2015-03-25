var fs = require('fs'),
    path = require('path');

fs.readdirSync(__dirname).forEach(function(filepath) {
  if (filepath !== 'index.js' && path.extname(filepath) === '.js') {
    require(path.resolve(__dirname, filepath));
  }
});
