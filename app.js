var express = require('express')
  , mincer = require('mincer')
  , http = require('http');

var app = express();

app.set('views', __dirname + '/client/templates');
app.set('view engine', 'jade');

// Assets

var environment = new (mincer.Environment);

[ 'bower_components', 'fonts', 'images', 'scripts', 'styles', 'templates' ].forEach(function(folder) {
  environment.appendPath('client/' + folder);
});

app.use('/assets', mincer.createServer(environment));

// Routes

app.get('*', function(req, res) {
  res.render('index', { title: 'AJ Ostrow' });
});

app.use(app.routes);

http.createServer(app).listen(process.env.PORT || 8000);
