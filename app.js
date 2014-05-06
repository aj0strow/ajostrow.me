if (process.env.NODE_ENV == 'production') {
  require('newrelic');
}

var express = require('express')
  , mincer = require('mincer')
  , http = require('http');

var app = express();

app.set('views', __dirname + '/client/templates');
app.set('view engine', 'jade');

// Assets

var cache = require('./server/cache');
var environment = new (mincer.Environment);

[ 'bower_components', 'fonts', 'images', 'scripts', 'styles', 'templates' ].forEach(function(folder) {
  environment.appendPath('client/' + folder);
});

app.configure('production', function () {
  app.use('/assets', cache('hours', 3));
});
app.use('/assets', mincer.createServer(environment));
app.use(express.favicon('client/images/favicon.png'));

// Middleware

app.use(express.bodyParser());

app.use(function (req, res, next) {
  res.promise = function (promise) {
    promise.then(res.json.bind(res, 200), res.json.bind(res, 422));
  };
  next();
});

// Routes

app.use(function (req, res, next) {
  var regex = /^\/thoughts/;
  return regex.test(req.path) 
    ? res.redirect(req.path.replace(regex, '/articles'))
    : next();
});

app.use(function (req, res, next) {
  var accept = req.accepted[0].subtype;
  return accept === 'html'
    ? res.render('index', { title: 'AJ Ostrow' })
    : next();
});

require('./server/routes')(app);
app.use(app.routes);

http.createServer(app).listen(process.env.PORT || 8000);

// Seed

require('./db/seed');
