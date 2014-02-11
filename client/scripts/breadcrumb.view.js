//= require breadcrumb

Ostrow.BreadcrumbView = Backbone.View.extend({
  template: 'breadcrumb',

  initialize: function () {
    this.crumbs = [];
  },

  events: {
    'route': 'crumble'
  },

  crumble: function (pathname) {
    var path = pathname.substring(1);
    this.crumbs.length = 0;
    var parts = [''];
    path.split('/').forEach(function (part) {
      parts.push(part);
      this.crumbs.push({ 
        path: parts.join('/'), 
        title: _.titleize(part)
      });
    }, this);
    this.render();
  },

  templateData: function () {
    return { crumbs: this.crumbs };
  }
});