//= require framework
//= require router

$(function () {
  new Ostrow.Router;
  Backbone.history.start({ pushState: true });

  $('a.menu').click(function (ev) {
    ev.preventDefault();
    var path = $(ev.target).attr('href');
    Backbone.history.navigate(path, true);
  });
});
