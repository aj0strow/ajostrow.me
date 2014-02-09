var db = req('database/db');
var article = req('database/article');
var when = require('when');

describe('article', function () {
  after(function () {
    return db.del('articles');
  });

  specify('#slugify', function () {
    var promise = article.slugify('1', 'hello');
    return promise.should.be.fulfilled;
  });

  specify('#save', function () {
    var promise = article.save('1', { slug: 'Hello' });
    return promise.should.be.fulfilled;
  });

  describe('#find', function () {
    before(function () {
      return article.save('2', { slug: 'cool-title' });
    });

    it('should return article', function () {
      return article.find('2').should.become({ slug: 'cool-title' });
    });
  });

  describe('#lookup', function () {
    before(function () {
      return article.slugify('2', 'cool-title');
    });

    it('should return article', function () {
      return article.lookup('cool-title').should.become({ slug: 'cool-title' });
    });
  });

  describe('#persist', function () {
    var attrs = { id: '3', slug: 'save-me' };

    before(function () {
      return article.persist('3', 'save-me', attrs);
    });

    it('should save article', function () {
      return article.find('3').should.become(attrs);
    });

    it('should slugify article', function () {
      return article.lookup('save-me').should.become(attrs);
    });
  });

  describe('#create', function () {
    var attrs = { title: 'New Record', slug: 'new-record' };

    before(function () {
      return article.create('new-record', attrs);
    });

    it('should add new article', function () {
      return article.count().should.become(1);
    });

    it('should slugify article', function () {
      return article.lookup('new-record').should.become(attrs);
    });
  });

  describe('#paginate', function () {
    before (function () {
      var articles = [ 'first', 'second', 'third' ].map(function (slug) {
        return article.create(slug, { slug: slug });
      });
      return when.all(articles);
    });

    it('should paginate by most recent', function (done) {
      var promise = article.paginate(0, 1).then(function (articles) {
        return articles.map(function (o) { return o.slug });
      });
      return promise.should.become([ 'third', 'second' ]);
    });
  });
});