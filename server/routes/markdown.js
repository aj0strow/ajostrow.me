var fs = require('fs');
var path = require('path');

function markdown (namespace) {
  function middleware (req, res, next) {
    var filename = req.param('slug') + '.md';
    var filepath = path.join(__dirname, '../../db', namespace, filename);
    fs.readFile(filepath, { encoding: 'utf8' }, function (err, markdown) {
      req.markdown = markdown;
      next();
    });
  }
  return middleware;
}

module.exports = markdown;