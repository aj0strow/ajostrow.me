I absolutely love Connect, the framework that powers Express. Much like Rack it is all about middleware, leading to wonderfully modular organization of code. 

## What Is Middleware?

Middleware functions are used by an application, in order, for each request / response pair. Middleware is used for parsing POST body data, CSRF protection, authenticating the user from the session, and all the other important pre-route work. This is what it looks like:

```js
function middleware(req, res, next) {
   // call the next middleware (completed successfully)
   next()

   // skip to error handling middleware
   next(new Error)
}

app.use(middleware)
```

## Higher Order Middleware

One useful thing you can do is write higher-order helper functions that return middleware. A common use case is finding the model based on the :id in a route:

```js
// api/middleware.js

function find(Model) {
   function middleware(req, res, next) {
      Model.find(req.params.id, function(error, model) {
         if (error) { next(error); }
         else { req.model = model; next(); }
      }
   }
   return middleware;
}

module.exports = {
  find: find
};
```

Middleware for a route is included as an extra param before the req/res callback. 

```js
// api/users.js

var express, helpers, User, app;

express = require("express");
middleware = require("./middleware");
User = require("../models/user");

app = express();

app.get("/users/:id", middleware.find(User), function(req, res) {
   res.render(req.model.toJSON());
});

module.exports = app;
```

## Modularity

Apps can be added as middleware to other apps, making express apps recursively modular. For example, the users api app can be used in the main application. 

```js
// app.js

var express, app, api = {};

express = require("express");
api.users = require("./api/users");

app = express();

app.get("/", function(req, res) {
   res.render("index");
});

app.use(api.users);

app.listen(process.env.PORT);
```

## Appending Routes

App middleware pieces can also be used at a specific route. For instance you could create an app module for authentication, and mount it:

```js
auth = express();
auth.get("/twitter", fn);
auth.get("/twitter/callback", fn);

// export and require auth

app.use("/auth", auth);
```