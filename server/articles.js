// Article
//
// id (string)
// slug (string)
// posted (int date)
// title (string)
// blurb (string)

var lodash = require('lodash')
var path = require('path')

var markdown = require('./markdown')
var json = require('../db/articles.json')

var __collection = lodash.sortByOrder(json, 'posted', 'desc')
var __index = lodash.indexBy(json, 'slug')

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
  var article = exports.find(slug)
  if (!article) {
    return Promise.reject(new Error('not found'))
  }
  return exports.render(slug).then(function (html) {
    return lodash.extend({ html: html }, article)
  })
}

exports.render = function (slug) {
  var pathname = path.resolve(__dirname, '../db/articles', slug) + '.md'
  return markdown.renderFile(pathname)
}
