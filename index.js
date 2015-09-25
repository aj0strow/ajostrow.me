var env = process.env['NODE_ENV']
var port = process.env['PORT']

if (env == 'production') {
  require('newrelic')
}

var app = require('./src/index')
app.listen(port || 8000)
