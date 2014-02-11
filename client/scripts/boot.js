//= require framework
//= require router
//= require breadcrumb.view

$(function () {
  var breadcrumbView = new Ostrow.BreadcrumbView({ el: '#breadcrumb' });
  var router = new Ostrow.Router;

  router.on('route', function (path) {
    breadcrumbView.trigger('route', path);
  });

  Backbone.history.start({ pushState: true });

  $('a.menu').click(function (ev) {
    ev.preventDefault();
    var path = $(ev.target).attr('href');
    Backbone.history.navigate(path, true);
  });

  $.getJSON('/articles/recent', function (articles) {
    articles.forEach(function (article) {
      $('#articles-recent').append(JST['articles/recent'].render(article));
    });
  });
});