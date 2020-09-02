//= require jquery/dist/jquery.min
//= require underscore/underscore-min

$(function () {
  function spin () {
    var el = $('.me')
    var clone = el.clone(true)
    el.before(clone)
    $('.me:last').remove()
    clone.addClass('spin')    
    setTimeout(spin, randWait())
  }

  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === 'visible') {
      spin()
    }
  })
})
