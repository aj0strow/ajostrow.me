var port = process.env['PORT']

var app = require('./server/app')
app.listen(port || 8000)
