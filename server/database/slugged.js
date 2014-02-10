var _ = require('lodash');
var db = require('./db');
var when = require('when');

module.exports = function slugged (ns) {
  _.extend(ns, {

    lookup: function (slug) {
      return db.get(ns.key('slugs', slug)).then(ns.find);
    },

    slug: function (id, slug) {
      return db.set(ns.key('slugs', slug), id);
    }
  });
}
