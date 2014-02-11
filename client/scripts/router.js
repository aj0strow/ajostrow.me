//= require_tree ./pages
//= require articles/article.model

Ostrow.Router = Backbone.Router.extend({
  initialize: function () {
  },

  routes: {
    '': 'redirect',
    'about': 'about',
    'articles': 'articles',
    'projects': 'projects',
    'articles/:slug': 'showArticle'
  },

  redirect: function () {
    Backbone.history.navigate('about', true);
  },

  about: function () {
    this.show(new Ostrow.AboutView);
  },

  articles: function () {
    this.show(new Ostrow.ArticlesView);
  },

  projects: function () {
    this.show(new Ostrow.ProjectsView);
  },
  
  showArticle: function(slug) {
    var model = new Ostrow.ArticleModel({ slug: slug });
    model.fetch().done(function () {
      this.show(new Ostrow.ArticleView({ model: model }));
    }.bind(this));
  },

  show: function (view) {
    if (this.currentView) { this.currentView.close(); }
    $('#ostrow').html(view.render().el);
    this.currentView = view;
  }
});
