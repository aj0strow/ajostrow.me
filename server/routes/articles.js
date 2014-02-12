var articles = require('../collections/articles');
var cache = require('../cache');
var markdown = require('./markdown');
var markup = require('./markup');

module.exports = function (app) {

  app.get('/api/articles', function (req, res) {
    var index = (req.param('page') || 0) * 30;
    res.promise(articles.paginate(index, index + 29).then(articles.fetch));
  });

  app.get('/api/articles/:slug', cache('hour'), markdown('articles'), markup, function (req, res) {
    var promise = articles.lookup(req.params.slug).then(function (json) {
      json.markup = req.markup;
      return json;
    });
    res.promise(promise);
  });

};