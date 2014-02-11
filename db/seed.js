var articles = require('../server/collections/articles');
var data = require('./articles.json');

function lazy() {
  if (data.length == 0) return;
  
  articles.persist(data.pop());
  setTimeout(lazy, 1);
};

articles.clear().then(lazy);