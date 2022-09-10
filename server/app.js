const env = process.env['NODE_ENV']

const express = require('express')
const path = require('path')
const CacheControl = require('express-cache-control')
const moment = require('moment')

const sitemap = require('./sitemap')
const assets = require('./assets')
const Articles = require('./articles')

const app = express()

app.use(express.static('public'))

app.set('views', path.resolve(__dirname, '../assets/templates'))
app.set('view engine', 'pug')

if (env == 'production') {
  const cache = new CacheControl().middleware
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
  const regex = /^\/thoughts/
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
  const perPage = 30
  const pageNumber = parseInt(req.query.page, 10) || 0
  const index = pageNumber * perPage
  const count = Articles.count()
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
      if (e.status === 404) {
        res.status(404).render('articles/not_found', {
          title: 'AJ Ostrow ~ Not Found',
        });
      } else {
        next(e)
      }
    })
})

module.exports = app
