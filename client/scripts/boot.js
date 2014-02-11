//= require framework
//= require router
//= require breadcrumb.view
//= require articles/recent

$(function () {
  $(document).on('click', 'a', function (ev) {
    ev.preventDefault();
    var $a = $(this);
    if ($a.attr('href')[0] == '/') {

      // internal link
      Backbone.history.navigate($a.attr('href'), true);
    } else {

      // external link
      $a.attr('target', '_blank');
      window.open($a.attr('href'));
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