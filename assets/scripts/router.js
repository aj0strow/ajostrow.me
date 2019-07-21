//= require_tree ./pages
//= require articles/articles.collection
//= require articles/recent.view

Ostrow.Router = Backbone.Router.extend({
  initialize: function () {
    this.pages = [];
    new Ostrow.ArticlesRecentView({
      el: '#recent-articles',
      collection: this.page(0)
    });
  },

  routes: {
    '': 'about',
    'about': 'about',
    'thanks': 'thanks',
    'articles(/:q)': 'articles',
    'projects': 'projects'
  },

  about: function () {
    this.show(new Ostrow.AboutView);
  },

  thanks: function () {
    this.show(new Ostrow.ThanksView);
  },

  articles: function (q) {
    if (q == undefined) q = 0;
    return isNaN(q) ? this.one(q) : this.many(+ q);
  },

  projects: function () {
    this.show(new Ostrow.ProjectsView);
  },

  // private

  many: function (index) {
    this.show(new Ostrow.ArticlesView({ collection: this.page(index), page: index }));
  },

  one: function (slug) {
    var model = new Ostrow.ArticleModel({ slug: slug });
    model.fetch().done(function () {
      this.show(new Ostrow.ArticleView({ model: model }));
    }.bind(this));
  },

  show: function (view) {
    if (this.currentView) { this.currentView.close(); }
    $('#ostrow').html(view.render().el);
    window.scrollTo(0, 0);
    $('p').each(function () {
      smartquotes(this)
    })
    this.currentView = view;
  },

  page: function (index) {
    var articles = this.pages[index];
    if (!articles) {
      articles = this.pages[index] = new Ostrow.ArticlesCollection;
      articles.fetch({ data: { page: index }, processData: true });
    }
    return articles;
  }

});
