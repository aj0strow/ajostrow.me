//= require framework
//= require router
//= require breadcrumb.view
//= require articles/recent

$(function () {
  $(document).on('click', 'a', function (ev) {
    ev.preventDefault();
    if (this.host == window.location.host) {
      Backbone.history.navigate(this.pathname, true);
    } else {
      this.target = '_blank';
      window.open(this.href);
    }
  });

  var breadcrumbView = new Ostrow.BreadcrumbView({ el: '#breadcrumb' });
  var router = new Ostrow.Router;

  router.on('route', function () {
    breadcrumbView.trigger('route', window.location.pathname);
  });

  Backbone.history.start({ pushState: true });

  $('a.menu').click(function (ev) {
    ev.preventDefault();
    var path = $(ev.target).attr('href');
    Backbone.history.navigate(path, true);
  });
});