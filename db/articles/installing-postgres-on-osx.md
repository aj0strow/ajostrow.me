Web application development typically relies on a persistence layer, often a relational database. Postgres is an excellent open-source database, and [you can read more about it](http://www.postgresql.org/about/). 

### Install Postgres

I'm assuming you have/use homebrew. To install Homebrew, check out my [setting OSX up for development article](http://www.ajostrow.me/thoughts/setting-up-osx-for-development#nav). 

```
$ brew rm postgresql --force
$ brew update
$ brew install postgresql
```

My installation took about 4 minutes. Next read the instructions Homebrew writes as output to the installation. Initialize the database: 

```
$ initdb /usr/local/var/postgres -E utf8
```

### Bash Aliases

It sucks to remember and type out the command to start and stop Postgres (see cheat sheet below), so instead create some aliases:

```
# ~/.bash_aliases

alias 'postgres.start'='pg_ctl -D /usr/local/var/postgres -l logfile start'
alias 'postgres.stop'='echo "server stopping";   # for consistency
  pg_ctl -D /usr/local/var/postgres stop -s -m fast'
```

Source the aliases file in .bashrc or .profile (whichever one you put most of your configuration in):

```
# ~/.profile

source ~/.bash_aliases
```

Easy to start:

```
$ postgres.start
server starting
```

Easy to stop:

```
$ postgres.stop
server stopping
```

### Database Users and Permissions

Some database users and permissions need to be created as well. Create the 'adminpack' extension to allow you to create users for each application. First, start the database again if you stopped it; then: 

```
$ psql postgres -c 'CREATE EXTENSION "adminpack";'
```

It's a good habit to make a new user for each application. Ideally you will always have different names for your apps and thus your database users. Open up the database prompt to create a new user, changing user_name to the name of your app. 

```
$ psql -d postgres
postgres=# create role user_name login createdb;
postgres=# \q
```

### Postgres Cheat Sheet

Start DB (hopefully aliased):

```
$ pg_ctl -D /usr/local/var/postgres -l logfile start
```

Stop DB:

```
$ pg_ctl -D /usr/local/var/postgres stop -s -m fast
```

Create a new database:

```
$ createdb -E UTF8 -w -O user_name database_name
```

Drop a database:

```
$ dropdb database_name
```

List databases:

```
$ psql -l
```

Check if a database exists:

```
$ psql -l | grep database_name
```

A database url would look something like this:

```
postgres://user_name@localhost/database_name
```

Or with a password:

```
postgres://user_name:password@localhost/database_name
```

