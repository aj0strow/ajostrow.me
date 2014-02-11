If you deploy on Heroku, or another PaaS that uses Postgres, or you just like it, it is high time to get it running on your machine. 

Here are the steps I used to get it working with a Ruby on Rails application. First, see my [Installing Postgres on OSX article](http://www.ajostrow.me/thoughts/installing-postgres-on-osx#nav). 

### Creating a User

Assuming you've got the database installed, make sure you have a database user specific to your app. A good choice of name is the name of the application, so the name of the source control repository. Start the database and the db console:

```
$ postgres.start
$ psql -d postgres
```

You can check if the user already exists (replacing user_name), if it says 0 rows, then the user doesn't exist yet:

```
postgres=# select rolname from pg_roles where rolname='user_name';
```

To create a new user:

```
postgres=# create role user_name login createdb;
```

Exit the console:

```
postgres=# \q
```

### Using Hstore

Hstores are basically key-value document functionality within Postgres. It's an extension though, which means it needs to be enabled for each database. It can only be run as well as a root user, so don't put the build in a migration.

Instead, for each database you create on your development machine, build it:

```
$ psql -d app_name_development -c "CREATE EXTENSION hstore;"
$ psql -d app_name_test -c "CREATE EXTENSION hstore;"
```

### Rails Configuration

Add the 'pg' gem to your gemfile to connect with PostgreSQL.

```ruby
# Gemfile

gem 'pg'
```

```
$ bundle install
```

Then add a database configuration file. Here's mine:

```yml
# config/database.yml

default: &default
  adapter: postgresql
  encoding: unicode
  pool: 5
  username: user_name
  password:

production:
  <<: *default
  database: app_name

staging:
  <<: *default
  database: app_name_staging

development:
  <<: *default
  database: app_name_development

test: &test
  <<: *default
  database: app_name_test
```

The final step is to actually create the database. 

```
$ bundle exec rake db:create
$ bundle exec rake db:migrate
```

Then you should be able to start up a server in development, and use the database as usual. 

```
$ rails server
```