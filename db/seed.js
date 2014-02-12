function lazy (namespace) {
  var collection = require('../server/collections/' + namespace);
  var data = require('./' + namespace + '.json');

  function step() {
    if (data.length == 0) return;
    collection.persist(data.pop());
    setTimeout(step, 1);
  }

  collection.clear().then(step);
}

lazy('articles');
