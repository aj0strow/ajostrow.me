//= require pages/articles
//= require articles/list.view

Ostrow.ArticlesView = Backbone.View.extend({
  template: 'pages/articles',

  title: 'AJ Ostrow ~ Articles',

  initialize: function (options) {
    this.page = options.page;
    this.listenTo(this.collection, 'add', this.append);
  },

  templateData: function () {
    return { page: this.page };
  },

  events: {
    'render:after': 'appendAll'
  },

  appendAll: function () {
    this.collection.each(this.append, this);
  },

  append: function (model) {
    this.add(new Ostrow.ArticlesListView({ model: model }), '.articles');
  }
});