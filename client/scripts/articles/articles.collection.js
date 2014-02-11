//= require articles/article.model

Ostrow.ArticlesCollection = Backbone.Collection.extend({
  url: '/articles',
  model: Ostrow.ArticleModel
});