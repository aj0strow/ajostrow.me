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
  
  function spin () {
    var el = $('.me')
    var clone = el.clone(true)
    el.before(clone)
    $('.me:last').remove()
    clone.addClass('spin')    
    setTimeout(spin, randWait())
  }
  
  function randWait () {
    var minute = 1000 * 60
    var minimum = 3 * minute
    var rand = Math.floor(Math.random() * 10 * minute)
    return minimum + rand
  }
  
  setTimeout(spin, randWait())
});