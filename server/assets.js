var mincer = require('mincer')
var environment = new (mincer.Environment)

environment.appendPath('node_modules')

var dirs = [
  'fonts',
  'images',
  'scripts',
  'styles',
]

dirs.forEach(function (dir) {
  environment.appendPath('assets/' + dir)
})

var server = mincer.createServer(environment)
module.exports = server
