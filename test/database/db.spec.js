var db = req('database/db');

describe('db', function () {
  it('should be running', function () {
    return db.ping().should.eventually.equal('PONG');
  });
});