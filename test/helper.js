global.assert = require('assert');

global.req = function (module) {
  return require('../server/' + module);
}