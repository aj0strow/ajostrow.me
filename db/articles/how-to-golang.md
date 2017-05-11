I'm coming up to a year with Golang, which seems like a good time to reflect. Below are some lessons learned the hard way. 

### Stop Writing Code

I have a tendency to write code nobody wants. It's hubris to assume you know what the project needs in the future. It's a logical fallacy to think one solution is better than another if both accomplish the same task. 

{ [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it) }

### Project Structure

Applications should use clean architecture to separate business logic from details like encoding and network protocols. 

Your root package should be for domain logic. 

```sh
$GOROOT/src/company.net/brandname
```

```go
package brandname

// domain types and interfaces here
```

You should not reference encoding formats, network protocols, or other implementation details within your root package. It should only include pure interfaces and domain types. 

Add command line programs as packages in the command directory.

```
$GOROOT/src/company.net/brandname/cmd/commandname
```

In the main package of the command name, start building the program. 

{ [The Clean Architecture](https://8thlight.com/blog/uncle-bob/2012/08/13/the-clean-architecture.html) }  
{ [Standard Package Layout](https://medium.com/@benbjohnson/standard-package-layout-7cdbc8391fc1) }

### Least Effort

*Stop writing code.* Implement only what you need for the next objective. Start with the final product and work backwards to find a simple solution. 

> We need a web service.

```go
package main

import (
    "net/http"
)

func main() {
    srv := &http.Server{
        Handler: nil,
    }
    srv.ListenAndServe()
}
```

Done. 

> We need a route for customers to sign up.  

```go
package main

func Signup(w http.ResponseWriter, r *http.Request) {
    http.Error(w, "not implemented", 503)
}

func main() {
    srv := &http.Server{
        Handler: http.HandlerFunc(Signup),
    }
    srv.ListenAndServe()
}
```

Done. 

> We need POST /signup for customer sign up, and everything else to 404.

```
package main

type webService struct {
    Signup http.Handler
}

func (web *webService) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    if r.Method == "POST" && r.URL.Path == "/signup" {
        web.SignupRoute.ServeHTTP(w, r)
    } else {
        http.Error(w, "not found", 404)
    }
}
```

Done. 

> Customers should provide email, password, and favorite ice cream. 

And on, and on, forever. Keep doing the minimum work to achieve the next goal.

{ [Skateboard, Bike, Car](https://medium.com/@awilkinson/skateboard-bike-car-6bec841ed96e) }

### Define Interfaces

Once the requirements leave the realm of i/o and enter general business logic, define the entity and interface in the root package. 

```
package brandname

type Customer struct {

}

type Signup struct {
    Email string
    Password string
    IceCream string
}

type CustomerService interface {
    Signup(*Signup) *Customer
}
```

Implement the interface using something in memory and move on to your next goal. You can always come back and implement it properly using a database if it stands the test of time. Chances are the first interface is wrong, so it's better to defer implementing. 

{ [Dependency Inversion](https://en.wikipedia.org/wiki/Dependency_inversion_principle) }

### Struct Definitions

When you implement domain interfaces, you want to pass a list of dependencies into the implementation to allow mocks and unit tests. Some properties are injected and some need initialization. 

```go
type Impl struct {
    Inject interface{}
    init map[string]int
}
```

It's important to catch errors passing properties in development, before a runtime error happens. Instead of comprehensive integration tests which are expensive to create, I like to use an initializer struct and panic when a property is missing. 

```go
type Impl struct {
    Inject interface{}
}

func(input Impl) New() *impl {
    if input.Inject == nil {
        panic("impl.Inject required")
    }
    return &impl{
        inject: input.Inject,
        init: map[string]int{},
    }
}

type impl struct {
    inject interface{}
    init map[string]int
}

var _ brandname.Interface = (*impl)(nil)
```

The private struct has to implement the domain interface. I pass the initializer struct by value to avoid requiring parens when calling. 

```go
domainInterface := subpackage.Impl{
    Inject: inject,
}.New()

// vs

domainInterface := (&subpacakge.Impl{
    Inject: inject,
}).New()
```

### Keep It Simple

* Stop inventing packages

* Start with the final product and work backwards

* Use pure domain types and interfaces

* Avoid implementing interfaces for as long as possible

When you follow this approach, you get speed and flexibility. Speed because it takes a few iterations to discover the correct interface and implementing takes time, so by mocking out interfaces you eliminate wasted coding iterations. Flexibility because your domain is plain structs and interfaces, so you can swap dependencies as needed.

{ [KISS](https://en.wikipedia.org/wiki/KISS_principle) }