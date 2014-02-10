module.exports = function namespace (string) {
  var ns;
  ns = {
    key: function () {
      var args = Array.apply(null, arguments);
      args.unshift(string);
      return args.join(':');      
    },

    use: function () {
      function plugin(cb) {
        if (typeof cb === 'string') cb = require('./' + cb);
        cb(ns); 
      }
      Array.apply(null, arguments).forEach(plugin);
      return ns;
    }
  }
  return ns;
}