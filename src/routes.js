var CacheControl = require('express-cache-control')
var bluebird = require('bluebird')
var Articles = require('./articles')

module.exports = function (app) {

  // List articles
  var PER_PAGE = 30
  
  app.get('/api/articles', function (req, res) {
    var index = (req.query.page || 0) * PER_PAGE
    var data = Articles.slice(index, index + PER_PAGE)
    res.status(200).json(data)
  })

  // Get one article and content
  var cache = (new CacheControl).middleware
  
  app.get('/api/articles/:slug', cache('hour'), function (req, res) {
    Articles.findAndRender(req.params.slug).then(function (data) {
      res.status(200).json(data)
    }).catch(function (e) {
      if (/not found/i.test(e.message)) {
        res.status(404).json({ error: 'not found' })
      } else {
        res.status(500).json({ error: 'server error' })
      }
    })
  })
}