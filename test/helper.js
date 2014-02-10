var chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

require('mocha-as-promised')();

global.assert = chai.assert;
global.expect = chai.expect;
global.specify = global.it;

global.req = function (module) {
  return require('../server/' + module);
};

var db = global.req('database/db');
global.flushdb = function () {
  return db.flushdb();
};
