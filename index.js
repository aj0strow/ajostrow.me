var bluebird = require('bluebird')
var Articles = require('./server/articles')

function buildRecentArticleCache() {
  bluebird
    .map(Articles.slice(0, 8), function (article) {
      return Articles.render(article.slug)
    })
    .catch(function (e) {
      console.error(e)
    })
}

var port = process.env['PORT']

var app = require('./server/app')
app.listen(port || 8000, function () {
  buildRecentArticleCache()
})
