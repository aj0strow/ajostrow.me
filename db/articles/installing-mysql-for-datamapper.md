The first thing to do is download MySQL. If you don't have homebrew, then the first thing to do is get homebrew, then come back to this article. 

```
$ brew update
$ brew install mysql
```

To turn the server on and off:

```
$ mysql.server start
$ mysql.server stop
```

### Creating Users

To create a new mysql user "app_name" and give it permission to mess with app namespaced databases run the commands below, substituting in your app's name. You could theoretically run everything as the root or as one user, but I think its better to make a new user for each project. 

```
$ mysql -u root mysql
> CREATE USER app_name@localhost;
> GRANT USAGE ON `app_name%`.* TO app_name@localhost;
> GRANT ALL PRIVILEGES ON `app_name%`.* TO app_name@localhost;
> FLUSH PRIVILEGES;
> \q
```

### Gemfile

Next up is to make sure the proper gems are installed. Add the following:

```ruby
# Gemfile

gem 'data_mapper'
gem 'dm-mysql-adapter'
```

```
$ bundle install
```

### Creating Databases

I like to add some helpful rake tasks to my Rakefile as follows:

```ruby
# Rakefile

namespace :db do
  
  task :drop do
    env = ENV['RACK_ENV'] || 'development'
    command = "DROP DATABASE IF EXISTS app_name_#{env};"
    system "mysql -u app_name -e \"#{command}\""
  end
  
  task :create do
    env = ENV['RACK_ENV'] || 'development'
    command = "CREATE DATABASE IF NOT EXISTS app_name_#{env}" +
      ' CHARACTER SET utf8 COLLATE utf8_general_ci;'
      system "mysql -u app_name -e \"#{command}\""
  end
  
end
```

To be used as follows:

```
$ rake db:create
$ rake db:drop
```

### Database URL and Ruby Setup

The easiest way to connect to the database is to set an environment variable. Usually this can be done as the follows:

```ruby
# if development mode
ENV['DATABASE_URL'] = 'mysql://app_name@localhost/app_name_development'

# if test mode
ENV['DATABASE_URL'] = 'mysql://app_name@localhost/app_name_test'
```

So you can setup datamapper like the following:

```ruby
require 'data_mapper'

DataMapper.setup(:default, ENV['DATABASE_URL'])

# more useful setup stuff below

DataMapper::Property::String.length(255)     # default is 50
DataMapper.finalize     # if not using rails
DataMapper.auto_upgrade! if settings.development?
```

### Defining Resources

The last thing to do is simply define resources anywhere after you setup DataMapper.

```ruby
class User
  include DataMapper::Resource
  ...
end
```

