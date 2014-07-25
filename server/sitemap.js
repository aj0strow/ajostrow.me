var createSitemap = require('sitemap').createSitemap

var sitemap = createSitemap({
  hostname: 'http://ajostrow.me',
  cacheTime: 600000,
  urls: [
    { url: '/about', changefreq: 'monthly' },
    { url: '/articles', changefreq: 'daily' },
    { url: '/projects', changefreq: 'monthly' },
  ],
})

var articles = require('../db/articles.json')

articles.forEach(function (article) {
  sitemap.add({ url: '/articles/' + article.slug })
})

module.exports = sitemap
