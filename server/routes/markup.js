var marked = require('marked');
var highlightjs = require('highlight.js');

marked.setOptions({
  highlight: function(code) {
    return highlightjs.highlightAuto(code).value;
  }
});

function markup (req, res, next) {
  marked(req.markdown, function (err, markup) {
    req.markup = markup;
    next(); 
  });
}

module.exports = markup;