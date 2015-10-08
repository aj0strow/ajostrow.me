Go is a well-designed language. It's hard to waste time or get fancy, but there's also very little guidance. Here's what i've found productive when writing server apps. 

### Database Interface

Wrap the sql database driver with an interface that can accommodate either a database connection or a transaction. I stole the idea from **[Foundation DB](https://en.wikipedia.org/wiki/FoundationDB)**. Apple bought the company and turned off the lights, but you can see old docs on [Way Back Machine](https://web.archive.org/web/20150325003219/https://foundationdb.com/key-value-store/documentation/developer-guide.html). 

The concept is to pass either a db or tx to functions that modify the database. It allows open-closed composition. Otherwise you write it initially to take a db, but later on it needs to run concurrently with some other logic so you have to change to tx, but that breaks every call site thru the code base. Yuck.

Instead, here's an interface to allow either.

```go
package db

import (
	"database/sql"
	_ "github.com/lib/pq"
	"os"
)

// For lack of a better name .. a database or transaction
type Acid interface {
	Exec(string, ...interface{}) (sql.Result, error)
	Prepare(string) (*sql.Stmt, error)
	Query(string, ...interface{}) (*sql.Rows, error)
	QueryRow(string, ...interface{}) *sql.Row
}

func Open() (*sql.DB, error) {
	databaseUrl := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", databaseUrl)
	if err != nil {
		return nil, err
	}
	return db, nil
}
```

To test the interface adheres to both types:

```go
func TestAcidInterface(t *testing.T) {
	var _ Acid = (*sql.DB)(nil)
	var _ Acid = (*sql.Tx)(nil)
}
```

### Http Errors

Composable actions need errors that bubble all the way to the client. To do this in a web environment, errors need an http status code. I stole the idea from **[http-errors](https://github.com/jshttp/http-errors)** npm module which was meant for express middleware. 

```go
package actions

type HttpError struct {
	status  int
	message string
}

func (err HttpError) Status() int {
	return err.status
}

func (err HttpError) Error() string {
	return err.message
}

func MakeHttpError(err error) HttpError {
  httpErr, ok := err.(HttpError)
  if ok {
    return httpErr
  } else {
    return HttpError{500, err.Error()}
  }
}
```

To test it adheres to the error interface:

```go
func TestErrorInterface(t *testing.T) {
	var _ error = (*HttpError)(nil)
}
```

Without http errors you need to use regular expressions or giant select statements with every type of error possible. If you add logic upstream that has a chance of error, you have to account for it in every downstream error handling statement. Yuck. 

Instead look how nice http errors are. 

```go
package api

func serveHTTP(w http.ResponseWriter, r *http.Request) {
  // do some stuff
  
  err, result := getResult()
  if err != nil {
    httpErr := actions.MakeHttpError(err)
    return http.Error(w, httpErr.Error(), httpErr.Status())
  }
  
  // do more stuff
}
```

### Compose Actions

I stole the idea of composing actions from the ruby gem **[interactor](https://github.com/collectiveidea/interactor)** meant for ruby on rails. The idea is to keep business logic in well-named actions that can compose other actions as the app gets more complex. 

To run an action you provide a context, execute, and it either succeeds or fails. There are two main advantages over ruby: type safe context parameters and concurrent sub-actions. For example to sign in:

```go
package actions

import (
	"encoding/base64"
	"company.com/project/db"
	"company.com/project/models"
	"golang.org/x/crypto/bcrypt"
)

type Signin struct {
	Email    string
	Password string
}

func (self Signin) Exec(db db.Acid) (*models.User, error) {
	if self.Email == "" {
		return nil, HttpError{400, "Signin: email is blank."}
	}

	if self.Password == "" {
		return nil, HttpError{400, "Signin: password is blank."}
	}

	user, err := FindUserByEmail{
		Email: self.Email,
	}.Exec(db)
	if err != nil {
		return nil, HttpError{404, "Signin: login failed."}
	}
  
	err = bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(self.Password))
	if err != nil {
		return nil, HttpError{404, "Signin: login failed."}
	}

	return user, nil
}
```

You can see `Signin` uses the `FindUserByEmail` action. Using the db-or-tx acid interface also allows running unit tests for actions in parallel. The I in A.C.I.D. stands for *isolation* so each trasaction can't see other transactions until they are committed. 

```go
func TestSignin(t *testing.T) {
	db := db.MustOpen()
	defer db.Close()

	tx := db.MustBegin()
	defer tx.Rollback()

	user1, err := Signup{
		Email:    "aj@epcylon.com",
		Password: "very secret",
	}.Exec(tx)
	if err != nil {
		t.Error(err)
	}

	user2, err := Signin{
		Email:    "aj@epcylon.com",
		Password: "very secret",
	}.Exec(tx)
	if err != nil {
		t.Error(err)
	}

	if user1.Uid != user2.Uid {
		t.Errorf("Signin should find user from signup.")
	}
}
```

I like this structure because it allows building and testing incremental business logic. It also doesn't tie business logic to communication transport, allowing websockets or event queues instead of just http handlers. 

Tweet [@aj0strow](https://twitter.com/aj0strow) to discuss further.
