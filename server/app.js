var env = process.env['NODE_ENV']

var express = require('express')
var http = require('http')
var path = require('path')
var CacheControl = require('express-cache-control')

var sitemap = require('./sitemap')
var assets = require('./assets')

function root (pathname) {
  return path.resolve(__dirname, '..', pathname)
}

var app = express()

app.use(express.static('public'))

app.set('views', root('assets/templates'))
app.set('view engine', 'jade')

if (env == 'production') {
  var cache = (new CacheControl).middleware
  app.use('/assets', cache('hours', 3))
}

app.use('/assets', assets)

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
  return regex.test(req.path) 
    ? res.redirect(req.path.replace(regex, '/articles'))
    : next()
})

app.use(function (req, res, next) {
  return (req.accepts(['html', 'json']) === 'html')
    ? res.render("index", { title: "AJ Ostrow" })
		: next()
})

require('./routes')(app)

module.exports = app
