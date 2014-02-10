var _ = require('lodash');
var db = require('./db');

module.exports = function collection (ns) {
  _.extend(ns, {

    count: function () {
      return db.zcard(ns.key());
    },

    add: function (id, unixtime) {
      return db.zadd(ns.key(), unixtime, id);
    },

    remove: function (id) {
      return db.zrem(ns.key(), id);
    },

    paginate: function (start, stop) {
      return db.zrevrange(ns.key(), start, stop);
    }

  });
}