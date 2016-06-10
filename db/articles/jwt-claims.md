
Start by reading [jwt.io](https://jwt.io/). It's a great intro for how to use JSON Web Tokens and some of the problems they were designed to solve. I would argue JWTs provide an advantage to app developers who choose to use them. 

JWT works as follows:

1. Somehow verify user identity.
2. Sign claims into JWT with secret key.
3. Client sends JWT with each request. 
4. Server parses JWT with secret key and checks claims. 

As long as each service has the same secret key as the authentication provider, it doesn't matter where or how the JWT token was generated. For example, you could sign in with Facebook, Email & Password, SMS Short Code, etc. You have one identity and multiple services (think Google, Heroku, etc.)

When each backend service only needs one secret key in common, it allows a very flexible micro service architecture where implementation boundaries are seamless to the client. Here's how to write Go code that parses and verifies tokens. 

### Auth Flow

The standard case is email and password. To start, the user signs up.

```
POST /signup

{
  "email": "user@gmail.com",
  "password": "secret"
}
```

On success, the user either needs to confirm email, or the client instantly signs in too. 

```
POST /signin

{
  "email": "user@gmail.com",
  "password": "secret"
}
```

The server response with JWT encoded claims. 

```
200 OK

{
  "jwt": "very.long.string"
}
```

For the duration of the session the client includes the JWT in the HTTP headers, and has access to resources and services specified in the claims. 

```
Authorization: Bearer very.long.string
```

### Setup

```go
// jwt.go

package jwt
```

When you create new JWT tokens, you are issuing claims from your service to the client. You should specify the `iss` (your domain).

```go
const iss = "example.com"
```

Sensitive configuration should be passed as an environment variable. 

```go
import "os"

var secret = []byte(os.Getenv("JWT_SECRET"))
```

For consumer apps, you usually don't want to grant claims *forever*. Choose a default `exp` duration.

```go
import "time"

// expire in two weeks
var exp = time.Hour * 24 * 14
```

You could verify your own timeouts using `iat` and a timestamp in the database, but a two-week expiration seems more than generous. The client should refresh their token at the beginning of the session to avoid a situation where they booted mid-session exactly two weeks from now. 

### Claims

I think it looks nice to type-alias a json object as a custom type.

```go
type Claims map[string]interface{}
```

You can create new claims objects just like a map.

```go
claims := Claims{"sub": user.UUID}
```

The other advantage is we can attach a sign method onto the custom map type.

```go
import "github.com/dgrijalva/jwt-go"

func (c Claims) Sign() string {
    token := jwt.New(jwt.SigningMethodHS256)
    token.Claims["iss"] = iss
    token.Claims["iat"] = time.Now().Unix()
    token.Claims["exp"] = time.Now().Add(exp).Unix()
    for k, v := range c {
        token.Claims[k] = v
    }
    s, err := token.SignedString(secret)
    if err != nil {
        panic(err)
    }
    return s
}
```

Using package looks and feels nice. 

```go
Claims{"sub": user.UUID}.Sign()
```

### Verify Token

The next step is to parse tokens back into claims.

```go
import "errors"

var InvalidToken = errors.New("jwt invalid token")

func Verify(input string) (Claims, error) {
	  token, err := jwt.Parse(input, getValidationKey)
	  if err != nil {
		    return nil, InvalidToken
	  }
	  if jwt.SigningMethodHS256.Alg() != token.Header["alg"] {
		    return nil, InvalidToken
	  }
	  if !token.Valid {
		    return nil, InvalidToken
	  }
	  if token.Claims["iss"] != iss {
		    return nil, InvalidToken
	  }
	  return Claims(token.Claims), nil
}

func getValidationKey(*jwt.Token) (interface{}, error) {
	  return secret, nil
}
```

You *absolutely must* check the `alg` claim for the proper algorithm, otherwise an attacker could use the `"none"` algorithm to bypass the secret key signature. Which means anyone can hack your system if you don't check. 

It can be nice to check the `iss` field to keep deployment environments separate. Your production `iss` should probably be the domain name of the service, but in dev and testing it can be something else. 

### Test Package

You could certainly test more than this, including error cases. 

```go
// jwt_test.go

package jwt

import "testing"

func TestSignVerify(t *testing.T) {
    token := Claims{"sub": "aj"}.Sign()
    claims, err := Verify(token)
    if err != nil {
        t.Fatal(err)
    }
    if claims["sub"] != "aj" {
        t.Errrof("wrong subject: %s", claims["sub"])
    }
}
```

### Protect Routes

The whole point was to check claims in routing middleware. Nobody seems to agree on routing and middleware libraries so I won't get too into it. The idea is to extract the bearer token, verify the JWT, and assign claims to the request context. 

```go
// main.go

package main

import (
    "net/http"
    "strings"
    "example.com/project/jwt"
)

var NotAuthorized = errors.New("not authorized")

func verify(r *http.Request) (jwt.Claims, error) {
    auth := r.Headers.Get("Authorization")
    if auth == "" {
        return nil, NotAuthorized
    }
    parts := strings.Split(auth, " ")
    if len(parts) != 2 || parts[0] != "Bearer" {
        return nil, NotAuthorized
    }
    claims, err := jwt.Verify(parts[1])
    if err != nil {
        return nil, NotAuthorized
    }
    return claims, nil
}
```

In your routes or middleware, check the claims (whatever they may be) against the resources the user wants to access with the request (whatever those might be). 

```go
func ModifyResource(w http.ResponseWriter, r *http.Request) {
  claims, err := verify(r)
  if err != nil {
      http.Error(w, err.Error(), 401)
      return
  }
  
  if !CanModifyResource(claims, r) {
      http.Error(w, "not authorized", 403)
      return
  }
  
  // do stuff
}
```

You could get fance and create a custom `Route` type that includes a claims checking function. You could also keep it simple stupid. Whatever you want really. 

### Partial Access

It may seem tempting to encode granular permissions into the JWT itself. That can work for API products where the clients generate and manage their own keys. It doesn't work for user permissions, because once the JWT is encoded, the claims exist until the JWT expires. 

You *can* keep a unique id for each JWT in the database and check on each request, but at that point you might as well just check the permissions themselves. 

Thanks for reading. Tweet [@aj0strow](https://twitter.com/aj0strow) with questions / concerns. 
