var Articles = require('../server/articles')
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
  
  specify('findAndRender should render markdown', function () {
    var slug = Articles.first().slug
    return Articles.findAndRender(slug).then(function (article) {
      assert(article.html)
    })
  })
})
