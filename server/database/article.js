var when = require('when');
var db = require('./db');
var objectid = require('./objectid');
var key = require('./key');

// Article Schema
//
// title (string)
// slug (string)
// blurb (string)
// posted (datetime)

var article;

module.exports = article = {
  
  // collection

  count: function () {
    return db.zcard('articles');
  },
  
  paginate: function (start, stop) {
    return db.zrevrange('articles', start, stop).then(function (ids) {
      return when.all(ids.map(article.find));
    });
  },
  
  // one
  
  find: function (id) {
    return db.hgetall(key('articles', id)).then(function (attrs) {
      if (attrs.posted) { attrs.posted = parseInt(attrs.posted, 10); }
      return attrs;
    });
  },

  lookup: function (slug) {
    return db.get(key('slugs', slug)).then(article.find);
  },
  
  // store

  create: function (slug, attrs) {
    var id = attrs.id = objectid(),
        posted = attrs.posted = + (new Date);
    return when.join(article.add(id, posted), article.persist(id, slug, attrs));
  },
  
  add: function (id, unixtime) {
    return db.zadd('articles', unixtime, id);
  },

  persist: function (id, slug, attrs) {
    return when.join(article.slugify(id, slug), article.save(id, attrs));
  },

  slugify: function (id, slug) {
    return db.set(key('slugs', slug), id);
  },

  save: function (id, attrs) {
    return db.hmset(key('articles', id), attrs);
  }

}