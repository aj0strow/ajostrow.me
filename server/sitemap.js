const createSitemap = require('sitemap').createSitemap
const articles = require('../db/articles.json')

const sitemap = createSitemap({
  hostname: 'http://www.ajostrow.me',
  cacheTime: 600000,
  urls: [
    { url: '/', changefreq: 'monthly' },
    { url: '/thanks', changefreq: 'monthly' },
    { url: '/articles', changefreq: 'daily' },
  ],
})

articles.forEach(function (article) {
  sitemap.add({ url: '/articles/' + article.slug, changefreq: 'monthly' })
})

module.exports = sitemap
