var articles = require('../collections/articles');

module.exports = function (app) {

  app.get('/articles', function (req, res) {
    res.promise(articles.paginate(0, 100));
  });

  app.get('/articles/recent', function (req, res) {
    res.promise(articles.recent(8));
  });

};