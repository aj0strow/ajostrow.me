// Comment
//
// id: string id
// fbid: string facebook id
// name: string
// text: string markdown

var namespace = require('../database/namespace');
var model = require('../database/model');

module.exports = namespace('comments').use(model);