It's useful to use factories when testing models. I like Factory Girl with Rails, but with Mongoose the closest I could find was [Factory Lady](https://github.com/petejkim/factory-lady). It does not come with nearly as many niceties. 

In the example code, there's this:

```coffee
emailCounter = 1

Factory.define 'user', User,
  email    : (cb) -> cb("user#{emailCounter++}@example.com") # lazy attribute
  state    : 'activated'
  password : '123456'
```

I think that looks terrible, so instead here's a sequence helper:

```
# fn = (int) -> string
sequence = (fn) ->
  count = 0
  (cb) -> cb fn(count++)
```

The idea is that the count is lexically scoped within the enclosing "sequence" invocation, and the count is incremented to generate unique strings. 

```
email = sequence (n) -> "user#{n}@example.com"

email console.log for [0..2]

# => user0@example.com
# => user1@example.com
# => user2@example.com
```

Then this can be used in factory lady definitions:

```
Factory.define 'user', User,
  email    : email
  state    : 'activated'
  password : '123456'
```

All in all a simple example of the power of lexical scoping in functional languages. 