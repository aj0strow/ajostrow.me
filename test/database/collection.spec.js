var namespace = req('database/namespace');
var collection = req('database/collection');
var when = require('when');

describe('collection', function () {
  var people = namespace('people').use(collection);

  specify('#add', function () {
    return people.add(+ (new Date), '1').should.be.fulfilled;
  });

  describe('#remove', function () {
    before(function () {
      return people.add(+ (new Date), '2');
    });

    it('should remove id', function () {
      return people.remove('2').should.be.fulfilled;
    });
  });

  describe('#count', function () {
    before(function () {
      return when.join(flushdb(), people.add(+ (new Date), '3'));
    });

    it('should equal 1', function () {
      return people.count().should.become(1);
    });
  });

  describe('#paginate', function () {
    before(function () {
      var promises = [
        flushdb(),
        people.add('1', 1.0),
        people.add('2', 2.0),
        people.add('3', 3.0)
      ];
      return when.all(promises);
    });

    specify('most recent first', function () {
      return people.paginate(0, 1).should.become([ '3', '2' ]);
    });
  });
});