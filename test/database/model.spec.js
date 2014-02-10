var namespace = req('database/namespace');
var model = req('database/model');
var when = require('when');

describe('model', function () {
  var users = namespace('users').use(model);

  specify('#save', function () {
    return users.save('0', { name: 'AJ' }).should.be.fulfilled;
  });

  describe('#find', function () {
    before(function () {
      return users.save('1', { name: 'AJ' }).should.be.fulfilled;
    });

    it('should fetch key', function () {
      return users.find('1').should.become({ name: 'AJ' });
    });
  });

  describe('#fetch', function () {
    var jg = { name: 'JG' };
    var jack = { name: 'Jack' };

    before(function () {
      return when.join(users.save('2', jg), users.save('3', jack));
    });

    it('should return them', function () {
      return users.fetch([ '2', '3' ]).should.become([ jg, jack ]);
    });
  });
});
