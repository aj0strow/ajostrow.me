The idea of nonblocking execution is sweet for performance, but there are a couple competing styles. One is with continuations (callbacks), and the other with promises. 

I find promises much easier to conceptualize and work with. You can combine collections of promises into super-promises, have them promised in series, etc. However, node libraries and many of the ORMs and other node modules use callbacks. 

## Callbacks To Promise

It's not too difficult to wrap callback-expecting functions to make promise-returning functions. My favorite promise library is [when](https://github.com/cujojs/when), but any module that implements the [Promises/A+ spec](http://promises-aplus.github.io/promises-spec/) should work. 

```javascript
// callback -> promise

var when = require('when');

function withCallbacks(args, error, success) {
  // module logic
}

function returnPromise(args) {
  var deferred = when.defer();
  withCallbacks(args, deferred.reject, deferred.resolve);
  return deferred.promise;
}
```

## Promise To Callbacks

If you want to use a module that returns promises, but you prefer callbacks, you can wrap the functions to do that as well:

```javascript
// promise -> callback

function returnPromise(args) {
  // module logic
}

function withCallbacks(args, error, success) {
  var promise = returnPromise(args);
  promise.then(success, error);
}
```