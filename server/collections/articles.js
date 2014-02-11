// Article
//
// id (string)
// slug (string)
// posted (int date)
// title (string)
// blurb (string)

var _ = require('lodash');
var when = require('when');


var objectid = require('../database/objectid');
var namespace = require('../database/namespace');

var articles = namespace('articles').use('model', 'collection', 'slugged');

articles.persist = function (attrs) {
  attrs = _.clone(attrs);

  if (!attrs.id) { attrs.id = objectid(); }
  if (!attrs.slug) { attrs.slug = attrs.id; }
  if (!attrs.posted) { attrs.posted = _.now(); }

  var promises = [
    articles.save(attrs.id, attrs),
    articles.slug(attrs.id, attrs.slug),
    articles.add(attrs.id, attrs.posted)
  ];

  return when.all(promises).then(function () { return attrs; });
};

articles.recent = function (amount) {
  return articles.paginate(0, amount).then(articles.fetch);
};

module.exports = articles;