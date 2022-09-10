// Article
//
// id (string)
// slug (string)
// posted (int date)
// title (string)
// blurb (string)

const lodash = require('lodash')
const path = require('path')
const LruCache = require('lru-cache')
const bluebird = require('bluebird')

const markdown = require('./markdown')
const json = require('../db/articles.json')

const env = process.env['NODE_ENV']
const __collection = lodash.orderBy(json, 'posted', 'desc')
const __index = lodash.keyBy(json, 'slug')
const __cache = new LruCache(100)

exports.first = function () {
  return __collection[0]
}

exports.slice = function (start, stop) {
  return __collection.slice(start, stop)
}

exports.count = function () {
  return __collection.length
}

exports.find = function (slug) {
  return __index[slug]
}

exports.findAndRender = function (slug) {
  const article = exports.find(slug)
  if (!article) {
    const e = new Error('not found')
    e.status = 404
    return Promise.reject(e)
  }
  return exports.render(slug).then(function (html) {
    return lodash.assign({ html: html }, article)
  })
}

exports.render = function (slug) {
  if (env === 'production') {
    const html = __cache.get(slug)
    if (html) {
      return bluebird.resolve(html)
    }
  }
  const pathname = path.resolve(__dirname, '../db/articles', slug) + '.md'
  return markdown.renderFile(pathname).tap(function (html) {
    __cache.set(slug, html)
  })
}
