Ruby is often chosen for domain-specific language implmentation, but it's possible to inject methods into javascript as well. I've used coffeescript in this example, but same thing really. 

The trick is to parse out the function body and create a new function with arguments, passing in the functions you want defined in the context. For a practical example, imagine unit-testing map-reduce functions for a mongodb app. 

```coffeescript
Array::mapReduce = (m, r) ->
  # emit adds values to a key group
  groups = {}
  emit = (key, value) ->
    (groups[key] ||= []).push(value)

  # parse out the function and create a new one
  fn = m.toString()
  body = fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}'))
  map = new Function('emit', body)

  # map over all documents
  for doc in docs
    map.call(doc, emit)

  # reduce values for key groups
  keys = Object.keys(groups)
  keys.map (key) ->
    { _id: key, value: r(key, groups[key]) }
```

Then to test mongodb map-reduce queries.

```coffeescript
docs = [
  { _id: 1, school: 'mcgill', gpa: 2.4 }
  { _id: 2, school: 'concordia', gpa: 3.6 }
  { _id: 3, school: 'mcgill', gpa: 3.1 }
]

Array.sum = (values) ->
  values.reduce (a, b) -> a + b

Array.avg = (values) ->
  Array.sum(values) / values.length

m = -> emit(@school, @gpa)
r = (key, values) -> Array.avg(values)

results = docs.mapReduce(m, r)
# [ { _id: 'mcgill', value: 2.75 },
#   { _id: 'concordia', value: 3.6 } ]
```

Testing map-reduce is the most practical example I could come up with, but there's sure to be other use cases that require more functions defined in scope. 
