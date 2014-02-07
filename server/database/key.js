function key () {
  return [].slice.call(arguments).join(':');
}

module.exports = key;