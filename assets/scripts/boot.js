//= require jquery/dist/jquery.min

console.info('Welcome! Hope you enjoy the articles. - AJ')

$(function () {
  function spin () {
    var el = $('.me')
    var clone = el.clone(true)
    el.before(clone)
    $('.me:last').remove()
    clone.addClass('spin')    
  }

  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === 'visible') {
      spin()
    }
  })
})
