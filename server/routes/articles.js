var articles = require('../collections/articles');
var auth = require('../auth');
var cache = require('../cache');

module.exports = function (app) {

  app.get('/articles', function (req, res) {
    var index = (req.param('page') || 0) * 30;
    res.promise(articles.paginate(index, index + 29).then(articles.fetch));
  });
  
  var markdown = require('./markdown');
  var markup = require('./markup');

  app.get('/articles/:slug', cache('hour'), markdown('articles'), markup, function (req, res) {
    var promise = articles.lookup(req.params.slug).then(function (json) {
      json.markup = req.markup;
      return json;
    });
    res.promise(promise);
  });

};