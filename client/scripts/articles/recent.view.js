Ostrow.ArticlesRecentView = Backbone.View.extend({
  initialize: function () {
    this.count = 0;
    this.listenTo(this.collection, 'add', this.append);
  },

  append: function (model) {
    if (++ this.count == 8) {
      this.stopListening(this.collection);
    }
    this.$el.append(JST['articles/recent'](model.toJSON()));
  }
});
