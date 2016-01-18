var env = process.env['NODE_ENV']
var port = process.env['PORT']

var app = require('./src/index')
app.listen(port || 8000)
