//= require pages/article

Ostrow.ArticleView = Backbone.View.extend({
  template: 'pages/article',

  templateData: function () {
    var json = this.model.toJSON();
    json.duration = moment(+ json.posted).fromNow();
    return json;
  },

  remove: function () {
    return this.$el.fadeOut(50);
  }
});