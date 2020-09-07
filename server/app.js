var env = process.env['NODE_ENV']

var express = require('express')
var path = require('path')
var CacheControl = require('express-cache-control')
var moment = require('moment')

var sitemap = require('./sitemap')
var assets = require('./assets')
var Articles = require('./articles')

var app = express()

app.use(express.static('public'))

app.set('views', path.resolve(__dirname, '../assets/templates'))
app.set('view engine', 'pug')

if (env == 'production') {
  var cache = new CacheControl().middleware
  app.use('/assets', cache('hours', 3))
}

app.use('/assets', assets.createServer())

// Routes

app.get('/sitemap.xml', function (req, res) {
  sitemap.toXML(function (xml) {
    res.status(200)
    res.set('content-type', 'application/xml')
    res.send(xml)
  })
})

app.use(function (req, res, next) {
  var regex = /^\/thoughts/
  if (regex.test(req.path)) {
    res.redirect(req.path.replace(regex, '/articles'))
  } else {
    next()
  }
})

app.use(function (req, res, next) {
  res.locals.recentArticles = Articles.slice(0, 8)

  res.locals.digest = function (path) {
    return '/assets/' + assets.getDigestPath(path)
  }

  next()
})

app.get('/', function (req, res) {
  res.render('about', {
    title: 'AJ Ostrow',
    breadcrumbs: [{ path: '/', title: 'About' }],
  })
})

app.get('/thanks', function (req, res) {
  res.render('thanks', {
    title: 'AJ Ostrow ~ Wall of Thanks',
    breadcrumbs: [{ path: '/thanks', title: 'Thanks' }],
  })
})

app.get('/articles', function (req, res) {
  var perPage = 30
  var pageNumber = parseInt(req.query.page, 10) || 0
  var index = pageNumber * perPage
  var count = Articles.count()
  res.render('articles/index', {
    title: 'AJ Ostrow ~ Articles',
    breadcrumbs: [{ path: '/articles', title: 'Articles' }],
    articles: Articles.slice(index, index + perPage),
    page: pageNumber,
    hasNext: index + perPage < count,
  })
})

app.get('/articles/:slug', function (req, res, next) {
  Articles.findAndRender(req.params.slug)
    .then(function (data) {
      res.render('articles/show', {
        title: 'AJ Ostrow ~ ' + data.title,
        breadcrumbs: [
          { path: '/articles', title: 'Articles' },
          { path: '/articles/' + req.params.slug, title: data.title },
        ],
        article: data,
        duration: moment(+data.posted).fromNow(),
      })
    })
    .catch(function (e) {
      next(e)
    })
})

module.exports = app
