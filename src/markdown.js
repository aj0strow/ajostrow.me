var bluebird = require('bluebird')
var fs = bluebird.promisifyAll(require('fs'))
var marked = bluebird.promisifyAll(require('marked'))
var highlight = require('highlight.js')

marked.setOptions({
  highlight: function (code) {
    return highlight.highlightAuto(code).value
  }
})

function renderFile (file) {
  return fs.readFileAsync(file, { encoding: 'utf8' }).then(render)
}

function render (text) {
  return marked.parseAsync(text)
}

exports.renderFile = renderFile
exports.render = render
