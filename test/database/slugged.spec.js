var namespace = req('database/namespace');
var slugged = req('database/slugged');

describe('slugged', function () {
  var posts = namespace('posts').use(slugged);

  specify('#slug', function () {
    return posts.slug('1', 'post-title').should.be.fulfilled;
  });

  describe('#lookup', function () {
    before(function () {
      return posts.slug('2', 'another-title');
    });

    it('should return id', function () {
      return posts.lookup('another-title').should.become('2');
    });
  });
});