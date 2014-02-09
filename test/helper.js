var chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

require("mocha-as-promised")();

global.assert = chai.assert;
global.expect = chai.expect;

global.req = function (module) {
  return require('../server/' + module);
}

global.specify = global.it;