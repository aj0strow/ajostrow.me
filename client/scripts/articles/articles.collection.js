Ostrow.ArticlesCollection = Backbone.Collection.extend({
  url: '/articles/recent',
  idAttribute: 'slug'
});