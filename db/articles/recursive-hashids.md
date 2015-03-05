I mention **[hashids](http://hashids.org/)** pretty frequently, but thought this was nifty enough to share. I've been writing a server with `koa` and `postgresql`, but trying to avoid numeric ids in json request and response bodies. The idea is to output encoded numeric ids as hash ids, and input decoded hashids as numeric ids. 

### Hashids

The basic usage is to encode and decode a numeric id.

```javascript
var hashids = new Hashids('company name', 8)

hashids.encode(5)
// => 'qrVqXN0Y'

hashids.decode('qrVqXN0Y')
// => [ 5 ]
```

One clear advantage is that you can include a parent namespace in the id. For example, you could encode an `app_id` and `user_id` as the consumer-facing `user_id`.

```javascript
hashids.encode(5, 10)
// => 'pNZxCQlv'

hashids.decode('pNZxCQlv')
// => [ 5, 10 ]
```

### Recursive Hashids

I wanted to recursively replace all hashids in the json body so the application always sees the numeric id, and the user always sees the hashid. It's actually not too hard with **[substack/js-traverse](https://github.com/substack/js-traverse)**.

```javascript
var traverse = require('traverse')
var _ = require('lodash')

function encode (object) {
  return traverse(object).map(function () {
    if (_.endsWith(this.key, 'id') && _.isNumber(this.node)) {
      return hashids.encode(this.node)
    } else {
      return this.node
    }
  })
}

function decode (object) {
  return traverse(object).map(function () {
    if (_.endsWith(this.key, 'id') && _.isString(this.node) && this.node.length == 8) {
      return hashids.decode(this.node)[0]
    } else {
      return this.node
    }
  })
}
```

This allows whole json objects to be encoded and decoded. 

```javascript
encode({ id: 1, stripe_id: 'cust_23aef04092' })
// => { id: 'olejRejN', stripe_id: 'cust_23aef04092' }

decode({ id: 'olejRejN', stripe_id: 'cust_23aef04092' })
// => { id: 1, stripe_id: 'cust_23aef04092' }
```

For testing I can still use normal ids.

```javascript
decode({ user_id: 10, vendor_id: 4 })
// => { user_id: 10, vendor_id: 4 }
```

### Middleware

Finally, with `koa` it's possible to rewrite every json body. 

```javascript
// app.js

var app = require('koa')()

app.use(function * (next) {
  yield next
  if (this.body) {
    this.type = 'application/json'
    this.body = encode(this.body)
  }
})

app.use(function * () {
  // render list of objects

  this.body = _.times(100, function (i) {
    return { id: i, name: 'User #' + i, balance: Math.random() * 10000 }
  })
})

app.listen(8000)
```

To test it out.

```sh
$ iojs app.js
$ time curl localhost:8000

[
  { "id": "qgVRZVmR",
    "name": "User #0",
    "balance": 5336.400221567601 },
  { "id": "WZ7G8Nkj",
    "name": "User #1",
    "balance": 6245.425492525101 },
    ...

real  0m0.028s
user  0m0.005s
sys 0m0.007s
```

Fast enough for me. To parse the request body, wrap the normal parser in a new generator. 

```javascript
var parse1 = require('co-body')

function * parse2 (context) {
  var body = yield parse1.json(context, { limit: '10kb' })
  return hashids.decode(body)
}

// for example in a route

function * (next) {
  var body = yield parse2(this)
}
```

Well that's it. Tweet [@aj0strow](https://twitter.com/aj0strow) if you wanna talk about it. 
