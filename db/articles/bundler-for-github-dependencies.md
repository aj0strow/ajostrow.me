I wasted a full day trying to get Mongoid to work with Grape. It just wouldn't load.

```ruby
# Gemfile

gem 'mongoid', github: 'mongoid/mongoid'
```

```ruby
# app.rb

require 'mongoid'
```

```
$ ruby api.rb
<snip>:112:in `require': cannot load such file -- mongoid (LoadError)
```

The problem is that when you install from source, the gem is not globally installed.

```
$ gem list | grep mongoid
# no mongoid
```

Instead, the solution is to use bundler and setup for the environment.

```ruby
ENV['RACK_ENV'] ||= 'development'
require 'bundler'
Bundler.setup(:default, ENV['RACK_ENV'].to_sym)
require 'mongoid'
```

And then it will require and work just fine. Don't be me, destined to deploy one day later than expected. Use bundler!