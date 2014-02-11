//= require jquery/jquery
//= require underscore/underscore
//= require jade/runtime
//= require backbone/backbone
//= require backbone-panorama/backbone.panorama

window.Ostrow = {};

_.mixin({
  titleize: function(str){
    if (str == null) return '';
    str = String(str).toLowerCase();
    function upcase(c) { return c.toUpperCase(); }
    return str.replace(/(?:^|\s|-)\S/g, upcase);
  }
});