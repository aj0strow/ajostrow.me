var markdown = req('markdown')
var assert = require('assert')

describe('markdown', function () {
  specify('render should convert markdown to html', function () {
    return markdown.render('**text**').then(function (html) {
      assert.equal('<p><strong>text</strong></p>', html.trim())
    })
  })
  
  specify('renderFile should convert whole file', function () {
    return markdown.renderFile(__dirname + '/markdown-test.md').then(function (html) {
      assert.equal('<p><strong>text</strong></p>', html.trim())
    })
  })
})
