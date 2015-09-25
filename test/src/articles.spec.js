var Articles = req('articles')
var assert = require('assert')

describe('articles', function () {
  specify('slice acts on article array', function () {
    var articles = Articles.slice(0, 10)
    assert.equal(10, articles.length)
  })
  
  specify('find grabs item by slug', function () {
    var article = Articles.find(Articles.first().slug)
    assert.deepEqual(article, Articles.first())
  })
  
  specify('path finds markdown file', function () {
    var article = Articles.first()
    var path = Articles.path(article.slug)
    assert.equal(path.slice(-3), '.md')
  })
  
  specify('findAndRender should render markdown', function () {
    var slug = Articles.first().slug
    return Articles.findAndRender(slug).then(function (article) {
      assert(article.html)
    })
  })
})
