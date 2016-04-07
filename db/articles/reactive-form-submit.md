The `Observable` might be the most powerful abstraction available to us programmers. It took me a while to catch on, because the terminology is dense and the resources were lacking. 

I want to share a practical reactive pattern from my own code. In case reactive programming and observables are new, here's some reading materials:

* [Intro to Reactive Programming](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)
* [Stream Handbook](https://github.com/substack/stream-handbook)
* [Railway Oriented Programming](http://fsharpforfunandprofit.com/posts/recipe-part2/)

The basic idea is you have three pipes: `(value, error, end)`. You can have lots of `value` events, maybe terminated by one `error` or `end` event. Some libraries allow multiple error events. Please read through the [Kefir docs](https://rpominov.github.io/kefir/) and then we can begin.

### Form Submit

When you have a website form, you want an event timeline like the following:

```
click save -> reassure user -> send server request -> confirm success
```

The naive approach is to set pending state on click, and then success state on resolve. 

```js
onClick = function () {
  setPendingState()
  
  saveToServer()
  .then(() => {
    setSuccessState()
  })
  .catch(err => {
    setFailureState(err)
  })
}
```

We can do better with a stream of submit clicks (an observable):

```js
s = clickStream()
```

What if the user accidentally **double-clicks**? We can prevent that:

```js
s = s.debounce(50, { immediate: true })
```

Same api call as before:

```js
s = s.flatMap(() => {
  setPendingState()
  return Kefir.fromPromise(saveToServer())
})
```

What if the save takes **less time than human perception**? We can delay it:

```js
perception = Kefir.later(120, {})

s = s.combine(perception, (a, b) => {
  return a
})
```

So far nothing has actually happened. The stream is lazy, so it's all set up and piped together, but we need to subscribe to activate and start the api calls and view updates. 

```js
s.onValue(() => {
  setSuccessState()
})

s.onError(err => {
  setFailureState(err)
})
```

Another option is to convert back to a promise. 

```js
s.toPromise()
.then(() => {
  setSuccessState()
})
.catch(err => {
  setFailureState(err)
})
```

You don't *need* observables to debounce clicks and ensure minimum request times, but i find the syntax easy to read and understand. When you choose to use observables, it's the same amount of work with or without fancy stuff, which encourages you to write correct code. 
