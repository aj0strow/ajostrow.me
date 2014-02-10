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
app.use(express.favicon('client/images/favicon.png'));

// Routes

app.use(function (req, res, next) {
  if (req.accepted[0].subtype === 'html') {
    res.render('index', { title: 'AJ Ostrow' });
  } else {
    res.promise = function (promise) {
      promise.then(res.json.bind(res, 200), res.json.bind(res, 422));
    };
    next();
  }
});

require('./server/routes')(app);
app.use(app.routes);

http.createServer(app).listen(process.env.PORT || 8000);
