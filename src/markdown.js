var bluebird = require('bluebird')
var fs = bluebird.promisifyAll(require('fs'))
var marked = bluebird.promisifyAll(require('marked'))
var highlight = require('highlight.js')

// auto include heading ids

var renderer = new marked.Renderer()

function quote (s) {
  return '"' + s + '"'
}

renderer.heading = function (text, level) {
  var tag = "h" + level
  var anchor = text.toLowerCase().replace(/[^\w]+/g, '-')
  return "<" + tag + " id=" + quote(anchor) + ">" + text + "</" + tag + ">"
}

// render markdown

marked.setOptions({
  gfm: true,
  highlight: function (code, lang) {
    if (lang) {
      return highlight.highlight(lang, code, true).value
    } else {
      return code
    }
  },
  renderer: renderer,
})

function renderFile (file) {
  return fs.readFileAsync(file, { encoding: 'utf8' }).then(render)
}

function render (text) {
  return marked.parseAsync(text)
}

exports.renderFile = renderFile
exports.render = render
