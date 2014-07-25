//= require articles/article.model

Ostrow.ArticlesCollection = Backbone.Collection.extend({
  url: '/api/articles',
  model: Ostrow.ArticleModel
});