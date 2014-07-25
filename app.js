var env = process.env.NODE_ENV

if (env == 'production') {
  require('newrelic')
}

var express = require('express')
var http = require('http')

var app = express()

app.set('views', 'assets/templates')
app.set('view engine', 'jade')

// Assets

var cache = require('./server/cache')
var assets = require('./server/assets')

if (env == 'production') {
  app.use('/assets', cache('hours', 3))
}

app.use('/assets', assets)
app.use(express.favicon('assets/images/favicon.png'))

// Middleware

app.use(express.bodyParser())

app.use(function (req, res, next) {
  res.promise = function (promise) {
    promise = promise.then(res.json.bind(res, 200))
    promise.catch(res.json.bind(res, 422))
  }
  next()
})

// Routes

var sitemap = require('./server/sitemap')

app.get('/sitemap.xml', function (req, res) {
  sitemap.toXML(function (xml) {
    res.set('content-type', 'application/xml')
    res.send(xml)
  })
})

app.use(function (req, res, next) {
  var regex = /^\/thoughts/
  return regex.test(req.path) 
    ? res.redirect(req.path.replace(regex, '/articles'))
    : next()
})

app.use(function (req, res, next) {
  var accept = req.accepted[0].subtype
  return accept === 'html'
    ? res.render('index', { title: 'AJ Ostrow' })
    : next()
})

require('./server/routes')(app)
app.use(app.routes)

app.listen(process.env.PORT || 8000)

// Seed

require('./db/seed')
