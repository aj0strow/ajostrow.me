I spent a lot of time building [pgschema](https://github.com/aj0strow/pgschema) to automagically migrate the database depending on a configuration file. I was tired of writing up and down scripts and lots of little migration files cluttering up the project. I moved on from using my own tool after [Andrey](https://twitter.com/shazow) showed me how he does migrations. It's very simple and works for any project. 

### Migrations Are Code

Write a function to migrate the database. Instead of running migration scripts using a separate tool or separate directory, include migration code directly in the same package where you open the database connection. 

```go
// in main package

func main() {
    // configure dependencies
    
    switch command {
    case "migrate":
        migrate(db)
    case "server":
        startServer(db, host, logger)
    default:
        help()
    }
}

func migrate(*sql.DB) error {
    // more later on
}
```

Keep track of migrations using a timestamp identifier. It should be unique and it allows sorting the migrations in order. Create a new timestamp using `date +%s` anytime you want to add a new migration. You could also manually increment a number but I prefer timestamps. 

```go
var migrations map[int64]func(*sql.Tx) error

func init() {
    migrations = make(map[int64]func(*sql.Tx) error)

    migrations[1557188813] = func(tx *sql.Tx) error {
        // migration code here
    }
}
```

Never modify an existing migration function. Always add a new migration function. That's it. Your database will always be up-to-date. 

### Running New Migrations

Sort all the migration functions by timestamp. 

```go
var ks []int64
for k := range migrations {
    ks = append(ks, k)
}
sort.Slice(ks, func(i, j int) bool {
    return ks[i] < ks[j]
})
```

We need a migrations table to keep track of executed migrations. 

```go
// mts stands for "migration timestamp"
_, err := db.Exec(`CREATE TABLE IF NOT EXISTS migrations (mts BIGINT PRIMARY KEY)`)
```

For each migration, we need to check if the database has already ran that migration. 

```go
for _, mts := range ks {
    n := 0
    row := db.QueryRow(`SELECT 1 FROM migrations WHERE mts = $1`, mts).
        Scan(&n)
    if err != sql.ErrNoRows && err != nil {
        return err
    }
    // Skip migrations already in the database. 
    if n == 1 {
        continue
    }
    // continued below
}
```

In order to never run the same migration twice, run the migration function and insert the migration timestamp into the database using the same transaction. All or nothing. 

```go
    // inside the loop above
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    migration := migrations[mts]
    err = migration(tx)
    if err != nil {
        tx.Rollback()
        return err
    }
    _, err = tx.Exec(`INSERT INTO migrations (mts) VALUES ($1)`, mts)
    if err != nil {
        tx.Rollback()
        return err
    }
    err = tx.Commit()
    if err != nil {
        tx.Rollback()
        return err
    }
```

### Helper for Simple Migrations

The vast majority of migrations are executing string commands. If you write a helper method to run a slice of string commands it cleans up the migration code. 

```go
func execAll(tx *sql.Tx, qs []string) error {
    for _, q := range qs {
        if _, err := tx.Exec(q); err != nil {
            return err
        }
    }
    return nil
}
```

I would avoid using a slice of string commands as the migration itself because in some cases you might want to update data or remove duplicates before creating a unique index. 

```go
    // example migration, create users table

    migrations[1557188813] = func(tx *sql.Tx) error {
        return execAll(tx, []string{
            `CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT NOT NULL)`,
            `CREATE UNIQUE INDEX users_email_key ON users (email)`,
        })
    }
```

### Tradeoffs With Frameworks

The main tradeoff is you can only migrate in one direction: `up`. There is no code for reversing or migrating `down` after a mistake. I think it's bad practice to delete tables or columns either way. If you want to remove a column it's far better to make the column nullable or remove unique or foreign key constraints so application code can safely ignore the column. If the column has been sitting around for a long time, at that point it makes sense to tidy the schema by dropping the column in a new migration. 
