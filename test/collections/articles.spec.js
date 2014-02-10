var articles = req('collections/articles');
var when = require('when');

describe('articles', function () {
  specify('#persist', function () {
    return articles.persist({}).should.be.fulfilled;
  });

  describe('#recent', function () {
    before(function () {
      var data = [ { title: 'New Blog' }, { title: 'Another Post' } ];
      return when.all(data.map(articles.persist));
    });

    it('should return most resent articles', function () {
      function title(as) { return as[0].title; }
      return articles.recent(1).then(title).should.become('Another Post');
    });
  });
});