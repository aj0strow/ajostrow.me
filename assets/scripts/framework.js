//= require jquery/dist/jquery.min
//= require underscore/underscore-min
//= require jade/runtime
//= require backbone/backbone
//= require backbone-panorama/backbone.panorama
//= require moment/min/moment.min
//= require smartquotes/dist/smartquotes

window.Ostrow = {};

_.mixin({
  titleize: function(str){
    if (str == null) return '';
    str = String(str).toLowerCase();
    function upcase(c) { return c.toUpperCase(); }
    return str.replace(/(?:^|\s|-)\S/g, upcase).replace(/-/g, ' ');
  }
});
