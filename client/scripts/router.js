//= require_tree ./pages

Ostrow.Router = Backbone.Router.extend({
  routes: {
    '': 'redirect',
    'about': 'about',
    'articles': 'articles',
    'projects': 'projects'
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

  show: function (view) {
    if (this.currentView) { this.currentView.close(); }
    $('#ostrow').html(view.render().el);
    this.currentView = view;
  }
});
