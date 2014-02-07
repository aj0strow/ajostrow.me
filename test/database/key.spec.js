var key = require('../../server/database/key');

describe('database/key', function () {
  it('should join on colon', function() {
    assert.equal('slugs:testing-with-mocha', key('slugs', 'testing-with-mocha'));
  });
});