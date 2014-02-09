var when = require('when');
var db = require('./db');
var objectid = require('./objectid');
var key = require('./key');

// Collections have the following properties:
//
// id (string)
// slug (string)
// posted (int date)

function collection(namespace) {
  var _;

  return _ = {
    // collection

    count: function () {
      return db.zcard(namespace);
    },

    paginate: function (start, stop) {
      return db.zrevrange(namespace, start, stop).then(function (ids) {
        return when.all(ids.map(_.find));
      });
    },

    // one

    find: function (id) {
      return db.hgetall(key(namespace, id)).then(function (attrs) {
        if (attrs.posted) { attrs.posted = parseInt(attrs.posted, 10); }
        return _.prepare(attrs);
      });
    },

    // no-op. override this.
    prepare: function (object) {
      return object;
    },

    lookup: function (slug) {
      return db.get(key('slug', namespace, slug)).then(_.find);
    },

    // store

    create: function (slug, attrs) {
      var id = attrs.id = objectid(),
          posted = attrs.posted = + (new Date);
      return when.join(_.add(id, posted), _.persist(id, slug, attrs));
    },

    add: function (id, unixtime) {
      return db.zadd(namespace, unixtime, id);
    },

    persist: function (id, slug, attrs) {
      return when.join(_.slugify(id, slug), _.save(id, attrs));
    },

    slugify: function (id, slug) {
      return db.set(key('slug', namespace, slug), id);
    },

    save: function (id, attrs) {
      return db.hmset(key(namespace, id), attrs);
    }
  };
}

module.exports = collection;