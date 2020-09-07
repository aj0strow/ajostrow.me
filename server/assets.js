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

exports.createServer = function() {
  return mincer.createServer(environment)
}

exports.getDigestPath = function(path) {
  const asset = environment.findAsset(path)
  if (!asset) {
    throw new Error('missing digest for path ' + path)
  }
  return asset.digestPath;
}
