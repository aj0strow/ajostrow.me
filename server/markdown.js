const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const marked = bluebird.promisifyAll(require('marked'))
const hljs = require('highlight.js')

// auto include heading ids

const renderer = new marked.Renderer()

function quote(s) {
  return '"' + s + '"'
}

renderer.heading = function (text, level) {
  const tag = 'h' + level
  const anchor = text.toLowerCase().replace(/[^\w]+/g, '-')
  return '<' + tag + ' id=' + quote(anchor) + '>' + text + '</' + tag + '>'
}

// render markdown

marked.setOptions({
  gfm: true,
  highlight: colorSyntax,
  renderer: renderer,
})

function renderFile(file) {
  return fs.readFileAsync(file, { encoding: 'utf8' }).then(render)
}

function render(text) {
  return marked.parseAsync(text)
}

function colorSyntax(code, lang) {
  if (hljs.getLanguage(lang)) {
    return hljs.highlight(lang, code, true).value
  }
  if (lang && lang != 'txt' && lang != 'text') {
    console.warn('invalid code highlight: %s', lang)
  }
  return hljs.highlightAuto(code, []).value
}

exports.renderFile = renderFile
exports.render = render
