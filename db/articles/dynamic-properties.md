Was reading through code on github, and came across this little gem of a package [merge-descriptors](https://github.com/component/merge-descriptors) by [@jonathanong](https://github.com/jonathanong). 

The package is just a few lines long, but opened up a world of ideas for me. 

```javascript
function (dest, src) {
  Object.getOwnPropertyNames(src).forEach(function (name) {
    var descriptor = Object.getOwnPropertyDescriptor(src, name)
    Object.defineProperty(dest, name, descriptor)
  })

  return dest
}
```

The rest of the article will go into depth about why this package is awesome. 

### Define Properties

ECMAScript 5 added the ability to define detailed properties. The default behavior of setting a property on an object can be replicated with more explicit syntax.

```javascript
var person = {};

person.name = 'AJ';

Object.defineProperty(person, 'name', {
  writeable: true,
  configurable: true, 
  enumerable: true, 
  value: 'AJ' 
});
```

Writable means the property value can be changed via assignment.

```javascript
person.name = 'Not AJ';
```

Configurable means it can be deleted, changed, and the property settings can be changed as well.

```javascript
delete person.name;
Object.defineProperty(person, 'name', { /* changes */ });
```

Enumerable means that the property shows up when iterating.

```javascript
for (var key in person) {
  console.log(key, person[key]);
}
```

You can get the property settings for any property on any object.

```javascript
Object.getOwnPropertyDescriptor(person, 'name');
```

That's just default behavior though. 

### Getters and Setters

Properties can also have custom getters and setters. This allows for cool things like lazy attributes. For example, only parsing a request body if necessary. 

```javascript
function Request (bodyString) {
  this.bodyString = bodyString;
}

Object.defineProperty(Request.prototype, 'bodyJSON', {
  get: function () {
    if (this._bodyJSON === undefined) {
      this._bodyJSON = JSON.parse(this.bodyString);
    }
    return this._bodyJSON;
  }
});

var req = new Request('{ "name": "AJ" }');
req.bodyJSON.name;  // 'AJ'
```

For a setter, we can make sure the request method is always all caps.

```javascript
Object.defineProperty(Request.prototype, 'method', {
  writeable: true,
  enumerable: true,
  set: function (method) {
    this._method = method.toUpperCase();
  },
  get: function () {
    return this._method;
  }
});

req.method = 'post';
req.method; // 'POST'
```

### Sugar

The above code doesn't look so good. Fortunately there's nicer syntax available. 

```javascript
var mixins = {};

var table = {
  ok: 200,
  created: 201,
  accepted: 202,
  // ...
};

// reverse lookups too
Object.keys(table).forEach(function (key) {
  table[ table[key] ] = key;
});

mixins.HumanStatus = {
  get status () {
    return table[this.statusCode];
  },

  set status (type) {
    this.statusCode = table[type];
  }
}
```

Now suppose we called the function written by Jonathan at the very beginning of the article `function mixin`. 

```javascript
function Response () {}
mixin(Response.prototype, mixins.HumanStatus);
var res = new Response;

res.statusCode = 200;
res.status; // 'ok'

res.status = 'created';
res.statusCode; // 201
```

### Nifty Idea

I haven't looked too deeply into javascript ORMs, but if I were writing one, I would provide then-able associations through getters. Basically augmented promises. 

For example, consider a `find` static method that returns a promise. If you call `then` on the promise, the user is eventually returned. 

```javascript
var userPromise = User.find(id);

userPromise.then(function (user) {
  // user has been fetched from db
});
```

But you could also add a getter to the user promise to return a new promise for associated posts. 

```javascript
var postsPromise = userPromise.posts;

postsPromise.then(function (posts) {
  // posts belonging to user fetched from db
});
```

Cool I guess. How about some methods on that new posts promise for chainable querying?

```javascript
postsPromise.order({ created_at: -1 }).limit(10).then(function (recentPosts) {
  // recent posts fetched from db
});
```

If you use a web framework that resolves promises for you implicitly (like Koa) then your asynchronous code could actually look and feel like synchronous code.

```javascript
function *() {
  var user = User.find(id);
  var posts = user.posts.limit(5);
  yield { user: user, posts: posts, count: posts.count }; 
}
```

So, yeah, dynamic properties!
