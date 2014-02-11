//= require framework
//= require router
//= require breadcrumb.view
//= require articles/recent

$.ajaxSetup({
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

$(function () {
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

  $.getJSON('/articles/recent', function (articles) {
    articles.forEach(function (article) {
      $('#recent-articles').append(JST['articles/recent'](article));
    });
  });
});