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
app.use(express.favicon(root('assets/images/favicon.png')))

app.use(express.bodyParser())

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
	if (req.accepted.length == 0) {
		return res.status(204).end()
	}
	var accept = req.accepted[0].subtype
	return (accept === "html" && !req.xhr)
		? res.render("index", { title: "AJ Ostrow" })
		: next()
})

require('./routes')(app)

module.exports = app
