var createSitemap = require('sitemap').createSitemap
var articles = require('../db/articles.json')

var sitemap = createSitemap({
  hostname: 'http://www.ajostrow.me',
  cacheTime: 600000,
  urls: [
    { url: '/', changereq: 'monthly' },
    { url: '/articles', changefreq: 'daily' },
  ],
})

articles.forEach(function (article) {
  sitemap.add({ url: '/articles/' + article.slug, changefreq: 'monthly' })
})

module.exports = sitemap
