When writing [express](https://expressjs.com/) apps, input validation is a total chore. You can't trust anything about the request body because it's parsed into dynamically typed data structures. 

### JSON Schema

[JSON Schema](http://json-schema.org/) is a standard for validating JSON data structure. You can validate schemas using **[epoberezkin/ajv](https://github.com/epoberezkin/ajv)** in JavaScript. 

```
$ npm install --save ajv
```

For an example, let's validate the signup route.

```json
{
  "title": "POST /signup",
  "description": "Create a new account.",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "password": {
      "type": "string",
      "format": "password"
    },
    "tos": {
      "description": "Terms of service agreement.",
      "type": "boolean"
    },
    "first_name": {
      "type": "string"
    },
    "last_name": {
      "type": "string"
    }
  },
  "required": [
    "email",
    "password",
    "tos"
  ]
}
```

Compile the schema.


```js
var AJV = require("ajv")
var ajv = new AJV()

var schema = require("signup.json")
var validate = ajv.compile(schema)
```

To validate data, call the compiled function.

```js
validate({
  email: "invalid"
})
// false

validate({
  email: "user@test.com",
  password: "whatever",
  tos: true
})
// true
```

When the validation returns false, errors are attached to the function (kind of weird tbh, but JavaScript is single-threaded so there's no risk of overwriting errors.) 

```
validate("invalid")
console.error(validate.errors)
```

### Middleware

Instead of manually checking the request body in each test, use middleware.

```js
// validate.js

var AJV = require("ajv")
var ajv = new AJV()

module.exports = function (schema) {
  
  // compile schema once
  var validate = ajv.compile(schema)
  
  return function (req, res, next) {
    if (validate(req.body)) {
      return next()
    }
    
    // not valid
    res.status(400).json({
      error: validate.errors[0].message
    })
  }
}
```

To validate params for a route, include the middleware.

```
var express = require("express")
var validate = require("./validate")

var app = express()

app.use(require("body-parser").json())

var schema = require("./signup.json")

app.post("/signup", validate(schema), function (req, res, next) {
  // req.body is valid
})
```

Invalid requests are rejected. The benefit of this approach is that JSON Schema is easier to write than custom validation code, and also serves as documentation. 

Thanks for reading,

[@aj0strow](https://twitter.com/aj0strow)
