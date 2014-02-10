var namespace = req('database/namespace');

describe('namespace', function () {
  var tests = namespace('tests');

  specify('#key', function () {
    tests.key('a', 'b').should.equal('tests:a:b');
  });

  specify('#plugin', function () {
    tests.use().should.equal(tests);
  });
});