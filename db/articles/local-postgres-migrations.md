Sometimes you move fast and forget *not null* constraints or *foreign keys* or other things users don't care about. In equal amounts, sometimes that comes back to bite you and it's time to fix the schema. 

Below is a guide to test migrations on the same data in heroku. 

### Postgres Version

The first step is to make sure you're running the same postgres version as heroku. To check, run psql and select the version. To access the remote shell:

```sh
$ heroku pg:psql -a myapp
```

Postgres has a function that returns the version:

```sql
select version();
-- [RECORD 1]
-- version | PostgreSQL 9.4.4 on x86_64-unknown-linux-gnu ...
```

So it's running `9.4.4`. Check your version, if the major or minor versions are different, you need to upgrade or downgrade. For example `9.3.9` is no good. 

### Upgrade Database

If necessary, upgrade your local postgresql version with homebrew. First backup the data and stop the server.

```sh
$ pg_dumpall > upgrade_backup
$ pg_ctl stop
```

Copy the old software packages to a versioned folder. Homebrew puts things in `/user/local/var/postgres` so here's what I did to upgrade from `9.3` to `9.4`.

```sh
$ brew unlink postgresql
$ mv /usr/local/var/postgres /usr/local/var/postgres93
$ brew update
$ brew upgrade postgresql
$ brew link postgresql
```

Start the new server and import the backup data. 

```sh
$ pg_ctl start -D /usr/local/var/postgres
$ psql -d postgres -f upgrade_backup
```

### Pull Database

To copy a heroku database to local machine, drop the local database and run the pull command.

```sh
$ dropdb mydb
$ heroku pg:pull DATABASE postgres://localhost/mydb -a myapp
```

It should copy. If you skipped the step about matching versions, you might get an error like:

```
pg_dump: server version: 9.4.4; pg_dump version: 9.3.9
pg_dump: aborting because of server version mismatch
```

You should now have a copy of the remote data. 

### Find Duplicates

To find duplicates, partition row numbers on the supposed-to-by-unique column. There should be only one row each, so if the row number is greater than 1, it's a duplicate. [Source: Stack Overflow](http://stackoverflow.com/a/14471928/824377).

For example, to find duplicate twitter ids in the users table:

```sql
select *
into duplicate_users
from (
  select twitter_id, row_number() over (partition by twitter_id) as row
  from users
) dups
where dups.row > 1;
```

Check the damage:

```sql
select count(*) from duplicate_users;
```

### Rewrite References

It's important to use natural keys when given the opportunity. Otherwise, like right now, you have to write code to manually "merge" users and overrite references in every related model. I've been meaning to write about natural keys, referential integrity, and why Rails kinda fucks you at the database level. In the meantime ...

Add foreign key checks for each relation. Otherwise it's possible to leave related data stranded. You have to be careful tho, if the data can't be accessed if unrelated, it may be better to cascade delete so the user doesn't suddenly have posts again they thought were long gone. 

```ruby
# In migration file

add_foreign_key :users, :comments
```

Next, write a script to one-by-one delete duplicate users. If it runs, you're done. Each time it breaks, figure out how to update the reference to protect the foreign key. Add the script as a database migration after the foreign keys, in the `up` method.

### Add Unique Key

Finally add a migration that adds the unique index. Push the code and run migrations, it should all go well because you tested it against real data. 

As always, feel free to tweet [@aj0strow](https://twitter.com/aj0strow) if you need help or if you know a better way. 
