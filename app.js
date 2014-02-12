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
  if (req.accepted[0].subtype === 'html') {
    res.render('index', { title: 'AJ Ostrow' });
  } else {
    next();
  }
});

require('./server/routes')(app);
app.use(app.routes);

http.createServer(app).listen(process.env.PORT || 8000);

// Seed

require('./db/seed');
