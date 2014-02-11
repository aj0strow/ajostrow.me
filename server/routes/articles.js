var articles = require('../collections/articles');
var auth = require('../auth');
var fs = require('fs');
var marked = require('marked');
var highlightjs = require('highlight.js');
var cache = require('../cache');

marked.setOptions({
  highlight: function(code) {
    return highlightjs.highlightAuto(code).value;
  }
});

module.exports = function (app) {

  app.get('/articles', function (req, res) {
    var index = (req.param('page') || 0) * 30;
    res.promise(articles.paginate(index, index + 29).then(articles.fetch));
  });
  
  function markdown (req, res, next) {
    var path = __dirname + '/../../db/articles/' + req.params.slug + '.md';
    fs.readFile(path, { encoding: 'utf8' }, function (err, markdown) {
      req.markdown = markdown;
      next();
    });
  }
  
  function markup (req, res, next) {
    marked(req.markdown, function (err, markup) {
      req.markup = markup;
      next(); 
    });
  }

  app.get('/articles/:slug', cache('hour'), markdown, markup, function (req, res) {
    var promise = articles.lookup(req.params.slug).then(function (json) {
      json.markup = req.markup;
      return json;
    });
    res.promise(promise);
  });

};