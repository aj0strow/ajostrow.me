I think using external routing and mdidleware is a mistake that adds complexity without much benefit. Here is an example of building up a type safe request stack specific to a single app. 

### Context

I borrowed the idea from [koa](http://koajs.com/) JavaScript framework. Golang developers usually pass request, response, params, and whatever else. Instead bundle and augment the request/response invocation into a context object. If you have a custom context object you have the ability to add methods and shortcuts specific to your app. 

```golang
// api/context.go

package api

import (
    "net/http"
    "net/url"
)

type Context struct {
    Request *http.Request
    Response http.ResponseWriter
    URLParams url.Values
}

type Handle func(*Context)
```

### Bring Your Own Router

In the server program we still need a router. My solution is to write an adapter function that wraps custom api handles into generic router handles. 

```golang
// cmd/project/main.go

package main

import (
    "net/http"
    "net/url"
    "github.com/julienschmidt/httprouter"
    "git.project.com/api"
)

func route(handle Handle) httprouter.Handle {
    return func(w http.ResponseRouter, r *http.Request, params httprouter.Params) {
        c := &Context{
            Request: r,
            Response: w,
            URLParams: url.Values{},
        }
        for _, param := range params {
            c.URLParams.Set(param.Key, param.Value)
        }
        handle(c)
    }
}

func home(c *api.Context) {
    c.Response.Write([]byte("custom context! woohooo!\n"))
}

func main() {
    r := httprouter.New()
    r.GET("/", route(home))
    http.ListenAndServe(":8000", r)
}
```

### Make Your Life Easy

We have a type safe custom context per request. We can add methods or do whatever we want. I can never remember whether it is Request or ResponseWriter where Header is a function. How about easy header access?

```golang
func (c *Context) Get(header string) string {
    return c.Request.Header.Get(header)
}

func (c *Context) Set(header, value string) {
    c.Response.Header().Set(header, value)
}
``` 

```golang
func home(c *api.Context) {
    c.Set("Content-Type", "text/plain; charset=utf-8")
    c.Response.Write([]byte("custom context! woohooo!\n"))
}
```

I usually want to parse a JSON request body. 

```golang
func (c *Context) Body(body interface{}) error {
    return json.NewDecoder(c.Request.Body).Decode(body)
}
```

```golang
type UserForm struct {
    FirstName string
    LastName string
    Email string
}

func signup(c *Context) {
    form := &UserForm{}
    err := c.Body(form)
    if err != nil {
        c.Set("X-Api-Error", err.Error())
        c.Set("Content-Type", "text/plain; charset=utf-8")
        c.Response.WriteHeader(400)
        c.Response.Write([]byte(err.Error()))
        return
    }
}
```

Ouch! My fingers! Make it stop!

```golang
func (c *Context) BadRequest(err error) {
    c.Set("X-Api-Error", err.Error())
    c.Set("Content-Type", "text/plain; charset=utf-8")
    c.Response.WriteHeader(400)
    c.Response.Write([]byte(err.Error()))
}
```

```golang
func signup(c *Context) {
    form := &UserForm{}
    err := c.Body(form)
    if err != nil {
        c.BadRequest(err)
        return
    }
}
```

Where did all the code go?

### Real Life Example

How about real life stuff? Like authenticating with either a JWT Bearer Token or API Key query parameter and loading the user from the database, that kinda stuff?

```golang
type Context struct {
    // omit prior fields
    User *User
}

type mw func(Handle) Handle

func stack(mws ...mw) mw {
    return func(next Handle) Handle {
        for _, mw := range mws {
            if mw != nil {
                next = mw(next)
            }
        }
        return next
    }
}

func AuthJWTBearerToken(conn db.Database, iss *TokenIssuer) mw {
    return func(next Handle) Handle {
        return func(c *Context) {
            if c.User != nil {
                next(c)
                return
            }
            bearer, ok := parseBearerToken(c.Get("Authorization"))
            if !ok {
                next(c)
                return
            }
            token, err := iss.Decode(bearer)
            if err != nil {
                c.BadRequest(err)
                return
            }
            user := &User{}
            err = conn.Collection("users").Find("id", token.Sub).One(user)
            if err == db.ErrNoMoreRows {
                c.BadRequest(err)
                return
            }
            if err != nil {
                c.InternalServerError(err)
                return
            }
            c.User = user
            next(c)
        }
    }
}

type TokenIssuer struct {
    Secret []byte
}

func (iss *TokenIssuer) ParseAndVerify(token string) (*jwt.Token, error) {
    // use jwt-go, etc
}

func parseBearerToken(header string) (string, bool) {
    // split the header, etc
}

func AuthAPIKeyQueryParam(conn db.Database) mw {
    return func(next Handle) Handle {
        return func(c *Context) {
            if c.User != nil {
                next(c)
                return
            }
            q := c.Request.URL.Parse()
            apiKey := q.Get("api-key")
            if apiKey == "" {
                next(c)
                return
            }
            user, err := findUserByAPIKey(conn, apiKey)
            if err == db.ErrNoMoreRows {
                c.BadRequest(err)
                return
            }
            if err != nil {
                c.InternalServerError(err)
                return
            }
            next(c)
        }
    }
}

func AuthMulti(conn db.Database, iss *TokenIssuer) mw {
    return stack(
        AuthJWTBearerToken(conn, iss),
        AuthAPiKeyQueryParam(conn),
    )
}
```

So much work! I just want to use `jwt-auth-middleware`! 

### Better To Duplicate

Is it worth sacrificing control and casting pointers out of `context.Context` to avoid duplicating code? Can you even abstract this logic away? Let's go over the choices made. 

In the simple example: 

* Request body is always in JSON format. 
* `400 Bad Request` errors are plain text and have a `X-Api-Error` field. 

In the real life example: 

* Database is a SQL datbase with a `users` table and `id` primary key. 
* JWT Subject claim is the User ID column. 
* Server accepts an API Key fallback in the query parameter `api-key`. 
* Database has an `api_keys` table that references a `users` table. 

What code did I duplicate in order to realize productivity gains? 

* `route(Handle)` to interface with the router, 12 SLOC.
* `mw` type and `stack(...mw)` function to implement middleware, 11 SLOC.
* `parseBearerToken` and some JWT boilerplate, ~24 SLOC. 

What are the chances of finding open source that does everything my way? For duplicating ~50 SLOC I get type safety, helper methods, and one less dependency. I'll take that trade. 
