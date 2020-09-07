document.addEventListener('DOMContentLoaded', function () {
  console.info('Welcome! Hope you enjoy the articles. ~ AJ')

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      var logo = document.querySelector('.me')
      if (!logo) {
        return
      }

      // Restart CSS keyframes.
      logo.classList.remove('spin')
      logo.style.animation = 'none'
      void logo.offsetHeight
      logo.style.animation = null
      logo.classList.add('spin')
    }
  })
})
