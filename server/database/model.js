var _ = require('lodash');
var db = require('./db');
var when = require('when');

function model (ns) {
  _.merge(ns, {

    find: function (id) {
      return db.hgetall(ns.key(id));
    },

    fetch: function (ids) {
      return when.all(ids.map(ns.find));
    },

    save: function (id, attrs) {
      return db.hmset(ns.key(id), attrs);
    }
  });
}

module.exports = model;