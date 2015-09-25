var mincer = require('mincer')
var environment = new (mincer.Environment)

var dirs = [
  'bower_components',
  'fonts',
  'images',
  'scripts',
  'styles',
  'templates',
]

dirs.forEach(function (dir) {
  environment.appendPath('assets/' + dir)
})

var server = mincer.createServer(environment)
module.exports = server
