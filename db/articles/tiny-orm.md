There are a number of packages in Go for mapping database rows to structs. 

* [github.com/doug-martin/goqu](https://github.com/doug-martin/goqu)
* [github.com/gocraft/dbr](https://github.com/gocraft/dbr)
* [github.com/jmoiron/sqlx](https://github.com/jmoiron/sqlx)
* [github.com/Masterminds/structable](https://github.com/Masterminds/structable)

The common theme is to use reflection to match column names with struct tags. It's messy, and you can accomplish the same outcome with simpler code. 

### Scanning

The reason developers use reflection to scan structs is to prevent code duplication. If you need to map columns only once, there's no issue.

```go
// FindById()

  var user User
  row := db.QueryRow(`
      SELECT id, email
      FROM users WHERE id = $1
  `, id)
  row.Scan(&user.Id, &user.Email)
```

What happens when you load users in multiple functions? It gets repetitive. 

```go
// FindByName()

// FindByEmail()

// FindByAcessToken()
```

Struct scanning lets you write column names as tags, and then automatically populate the struct.

```go
type User struct {
    ID string `db:"id"`
    Email string `db:"email"`
}

var user User
LoadStruct(row, &user)
```

There's a few concessions with this approach. You lose the ability to scan into private fields.

```go
type User struct {
    password string
}

// can't load User password
```

You lose the ability to check pointer references at compile time. The mapping information in struct tags can only be checked at runtime. 

```go
type Event struct {
    Email string `db:"emial"`
}

// can't load User email
```

You lose parity between the database schema and the struct. When you add new columns, you need to go back and update every select query otherwise it won't load. 

```go
row := QueryRow(`
    SELECT id, email FROM users WHERE id = $1
`, id)
LoadStruct(row, &user)
```

Finally, the database struct tags leak from the data access layer into the business logic layer. Your core structs shouldn't know about database columns. 

Is there a better way? I think so. 

### Record Interface

You can accomplish the same thing using a `Record` interface with columns and values.

```go
type Columns []string

type Values []interface{}

type Record interface {
    Columns() Columns
    Values() Values
}
```

If your application needs to load complete user records, create a `UserRecord` struct that implements the `Record` interface. 

```go
type UserRecord struct {
    User
}

func (user *UserRecord) Columns() Columns {
    return Columns{
        "id",
        "email",
    }
}

func (user *UserRecord) Values() Values {
    return Values{
        &user.ID,
        &user.Email,
    }
}

var _ Record = (*UserRecord)(nil)
```

When you want to load a complete record, use the record type to select columns and scan rows. 

```go
// FindById()

  user := &UserRecord{}
  row := db.QueryRow(`
      SELECT ` + strings.Join(user.Columns(), ", ") + `
      FROM users WHERE id = $1
  `, id)
  row.Scan(user.Values()...)
  
// FindByName()

  user := &UserRecord{}
  row := db.QueryRow(`
      SELECT ` + strings.Join(user.Columns(), ", ") + `
      FROM users WHERE lower(name) ILIKE $1
  `, "%" + strings.ToLower(name) + "%")
  row.Scan(user.Values()...)
```

The code duplication is gone. 

### Summary

You can write syntax sugar to join columns and scan record slices. The important part is the column order and scan order are in one place. 

Key benefits of this approach: 

* Prevent loading partial structs. 
* Keep data access and business logic separate. 
* Remove hard dependency on `database/sql` (works with `github.com/jackc/pgx`.)
* Support private struct fields. 
* Remove complex dependency with runtime reflection. 

Not bad for a tiny interface, eh?

```go
type Columns []string

type Values []interface{}

type Record interface {
    Columns() Columns
    Values() Values
}
```
