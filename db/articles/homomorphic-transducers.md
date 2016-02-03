Sorry for the dense title. The article is about reducing a series of values independent of data type. 

### Reducer

The basic operation is given a result and input, calculate a new result. For example to sum a series of values you add them. 

```js
// reducer: result, input -> result

const add = (result, input) => result + input
```

The function `reduce` takes a reducer, an initial result, an interator, and returns the reduced result. Anything that's iterable in javascript could be used as a series of values. 

```js
let result = reduce(add, 0, [ 1, 2, 3 ])
// result = 6
```

Addition isn't very exciting, it's an example. You can calculate whatever you want. The only rule is that the input result and output result are the same type.

```js
const uniq = function (set, item) {
  set.add(item)
  return set
}

let result = reduce(uniq, new Set(), [ 1, 1, 1, 2 ])
// result = new Set([ 1, 2 ])
```

### Transducer

[Clojure popularized transducers](http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming), which are generic transforms that can be applied to many types of iterators. 

```js
// transducer: reducer -> reducer
```

Usually the `map` function would take an iterator and a function, and return an array. For example:

```
const arraymap = function (f, iterator) {
  let output = []
  for (let input of iterator) {
    output.push(f(input))
  }
  return output
}
```

However you force the output of `arraymap` to be an array. You need to rewrite the function for each output type. Imagine you'd like to map over a set. 

```
const setmap = function (f, iterator) {
  let output = new Set()
  for (let input of iterator) {
    output.add(f(input))
  }
  return output
}
```

Sweet it works! Except now you want one for key-value objects. You could write *another* map function, but this is getting repetitive. Instead, write a generic transducer map.

```js
const map = function (f) {
  return function (r) {
    return function (result, input) {
      return r(result, f(input))
    }
  }
}
```

Instead of assuming which output type, transducers let the calling function choose how to reduce output values into a result.

```js
const arrayreducer = function (array, input) {
  array.push(input)
  return array
}

const arraymap = function (f, iterator) {
  return reduce(map(f)(arrayreducer), [], iterator)
}
```

Still with me? Instead of writing out `arraymap` and other typed methods, we can transduce.

```js
const transduce = function (transducer, reducer, result, iterator) {
  return reduce(transducer(reducer), result, iterator)
}
```

We can rewrite the typed map functions to use transduce. There's little reason to use typed functions, the point is to show how it works.

```js
const arraymap = function (f, iterator) {
  return transduce(map(f), arrayreducer, [], iterator)
}

const setreducer = function (set, input) {
  set.add(input)
  return set
}

const setmap = function (f, iterator) {
  return transduce(map(f), setreducer, new Set(), iterator)
}
```

So far the gain has been one map definition instead of one per type. 

### Compose Transforms

Anytime you have a function that has the same type of input as output, you can compose them together.

```js
// compose: (a -> a), (a -> a) -> (a -> a)

const compose = function () {
  let transforms = [].slice.call(arguments).reverse()
  return function (reducer) {
    return reduce((t, r) => t(r), reducer, transforms)
  }
}
```

For example you can map and then filter.

```js
let t = compose(
  map(x => x + 1),
  filter(x => x % 2 == 0)
)

transduce(t, add, 0, values)

// same as

values.map(x => x + 1)
  .filter(x => x % 2 == 0)
  .reduce(add, 0)
```

One advantage is that you don't need to create intermediate collections, which can save memory. The main point is to separate output from transformation. 

```
transduce(t, setreducer, new Set(), values)
```

Another advantage is that you can take values from an infinite generator without knowing in advance how many to calculate.

```
let t = compose(filter(x => x > 5), take(2))
let infinite = function *() {
  let n = 0
  while (true) {
    yield n++
  }
}
transduce(t, arrayreducer, [], infinite())
```

You also only need to write higher order transducers instead of lower order collection functions per type. 

### Homomorphic Target

The idea comes from [Haskel Monoids](https://wiki.haskell.org/Monoid) to remove the final piece of duplication using homomorphic targets. Instead of specifying both the reducer and the initial value, let the target (initial value) reduce itself. 

```js
class Sum {
  constructor () {
    this.value = 0
  }
  
  next (input) {
    this.value += input
    return this
  }
  
  done () {
    return this.value
  }
}
```

Given a target with `next` and `done` methods, you can reduce any iterator. 

```js
const into = function (target, t, iterator) {
  let reducer = (result, input) => result.next(input)
  let result = transduce(t, reducer, target, iterator)
  return result.done()
}
```

For example to sum a number of values, convert the iterator through the transform, and then reduce it using a homomorphic target.

```
let result = into(new Sum(), map(x => -x), [ 1, 2, 3 ])
// result = -6
```

I like transducers, even if not entirely useful. You can find me on twitter [@aj0strow](https://twitter.com/aj0strow).
