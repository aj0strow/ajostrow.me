var db = req('database/db');
var collection = req('database/collection');
var when = require('when');

var articles = collection('articles');


describe('articles', function () {
  after(function () {
    return db.del('articles');
  });

  specify('#slugify', function () {
    var promise = articles.slugify('1', 'hello');
    return promise.should.be.fulfilled;
  });

  specify('#save', function () {
    var promise = articles.save('1', { slug: 'Hello' });
    return promise.should.be.fulfilled;
  });

  describe('#find', function () {
    before(function () {
      return articles.save('2', { slug: 'cool-title' });
    });

    it('should return article', function () {
      return articles.find('2').should.become({ slug: 'cool-title' });
    });
  });

  describe('#lookup', function () {
    before(function () {
      return articles.slugify('2', 'cool-title');
    });

    it('should return article', function () {
      return articles.lookup('cool-title').should.become({ slug: 'cool-title' });
    });
  });

  describe('#persist', function () {
    var attrs = { id: '3', slug: 'save-me' };

    before(function () {
      return articles.persist('3', 'save-me', attrs);
    });

    it('should save article', function () {
      return articles.find('3').should.become(attrs);
    });

    it('should slugify article', function () {
      return articles.lookup('save-me').should.become(attrs);
    });
  });

  describe('#create', function () {
    var attrs = { title: 'New Record', slug: 'new-record' };

    before(function () {
      return articles.create('new-record', attrs);
    });

    it('should add new article', function () {
      return articles.count().should.become(1);
    });

    it('should slugify article', function () {
      return articles.lookup('new-record').should.become(attrs);
    });
  });

  describe('#paginate', function () {
    before (function () {
      var promises = [ 'first', 'second', 'third' ].map(function (slug) {
        return articles.create(slug, { slug: slug });
      });
      return when.all(articles);
    });

    it('should paginate by most recent', function (done) {
      var promise = articles.paginate(0, 1).then(function (objects) {
        return objects.map(function (o) { return o.slug });
      });
      return promise.should.become([ 'third', 'second' ]);
    });
  });
});