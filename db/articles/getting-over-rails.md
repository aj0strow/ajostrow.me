Rails was built to ease the pain of building scalable web applications. Scripts, stylesheets, and images have long been served off CDNs to speed up page load, but with powerful client-side frameworks the entire front-end can be served independently of the server. The asset management and view rendering capabilities of Rails are now unnecessary.

However Rails gives structure to web applications, so many developers are still using Rails instead of switching to a more apt Rack framework for APIs (like Grape or Sinatra). This article is a guide towards Ruby web application structure sans Rails. Many of the ideas in the article are based on work that's based on [The Twelve Factor App](http://12factor.net/). 

### Bundler

The first step with any Ruby project is to start a `Gemfile` for dependencies. Keep the `Gemfile.lock` in version control, otherwise you need to specify hard dependencies in the `Gemfile`. 

```ruby
# Gemfile

source 'https://rubygems.org'
ruby '2.1.0'

gem 'rake'
gem 'puma'

group :development, :test do
  gem 'did_you_mean'
end

group :test do
  gem 'minitest'
  gem 'rack-test', require: 'rack/test'
end
```

Every rack application should use these gems. Rake runs tasks with Rakefile (more to come), Puma is a fast server, and Minitest supports RSpec-style BDD without silly matchers or performance problems. More on testing later tho.

```sh
$ bundle install
```

### Environment

Instead of `RAILS_ENV`, rack applications normally store which environment in the `RACK_ENV` variable. Rails loads all of your dependencies for you, which is nice, but Bundler can do that too.

```ruby
# config/environment.rb

require 'rubygems'
require 'securerandom'
require 'set'
require 'bundler/setup'
Bundler.require(:default, ENV['RACK_ENV'])
```

In the environment file, require the entire app as well. My applications haven't gotten large enough to justify autoloading. **[jarmo/require_all](https://github.com/jarmo/require_all)** can help with that.

```ruby
# config/environment.rb (cont.)

%w[ helpers models services routers api ].each do |dir|
  require_rel "../app/#{dir}/**/*.rb"
end
```

### Configuration

Most of the Rails configuration has to do with plugins, middleware, view rendering, asset management, and other things you don't need anymore. Instead store environment-dependent configuration in shell environment variables. To aid the process use **[bkeepers/dotenv](https://github.com/bkeepers/dotenv)** and create `.env` file.

```ruby
# config/environment.rb

require 'dotenv'

Dotenv.load
```

As a side note, the staging environment should use the `production` rack environment but with different shell env variables so that the staging app accesses different resources (like a different database). 

### Console

One of the best parts of Rails is the interactive console when trying to debug problems on the server. Now that the environment can be loaded by requiring one file, writing tasks for an interactive console is possible using **[pry/pry](https://github.com/pry/pry)**.

```
# Rakefile

task :environment do
  require_relative 'config/environment'
end

task console: :environment do
  require 'pry'
  binding.pry(quiet: true)
end
```

### Rack Test

Ruby developers are infamous for test coverage. Rack has a fantastic test library and minitest has a fantastic BDD interface.

```ruby
# test/runner.rb

require 'minitest/autorun'

class MiniTest::Spec
  include Rack::Test::Methods

  def app
    API
  end

  def json
    MultiJson.load(last_response.body, symbolize_keys: true)
  end
end

require_rel '**/*_spec.rb'
```

To run the tests in a rake task require the runner file.

```ruby
# Rakefile

task :test do
  ENV['RACK_ENV'] = 'test'
  Rake::Task['environment'].invoke
  require_relative 'test/runner'
end
```

All specs need to be in the test directory with the file suffix `_spec.rb`, for example a router spec. Including rack test methods and specifying the app allows testing of route requests. 

```ruby
# test/routers/sessions_router_spec.rb

describe SessionsRouter do
  describe 'POST /sessions' do
    it 'should fail for bad oauth token' do
      post '/sessions', { token: 'garbage' }
      refute last_response.success?
    end

    it 'should success for good token' do
      user = create(:user)
      post '/sessions', { token: user.oauth_token }
      assert_equal(user.id, json[:id])
    end
  end
end
```

When making a request in tests, the method signature is as follows.

```ruby
verb(path, params, rack_env)
```

For example if you wanted to get posts with an offset parameter and a bearer token.

```ruby
get('/posts', { offset: 200 }, { 'HTTP_AUTHORIZATION' => "Bearer #{user.token}" })
```

### Active Record

There are many alternate ORMs, but Active Record is still the most common. To get it working, include the rake tasks in the rake file.

```ruby
# Rakefile

require 'active_record'
require 'dotenv'

Dotenv.load

include ActiveRecord::Tasks

DatabaseTasks.tap do |config|
  config.env = ENV.fetch('RACK_ENV', 'development')
  config.db_dir = File.join(__dir__, 'db')
  config.migrations_paths = File.join(__dir__, 'db/migrations')
end

load 'active_record/railties/databases.rake'
```

The tasks looks for the `DATABASE_URL` environment variable. All of the usual tasks are included like create, migrate and rollback under the db namespace. 

To avoid losing the development database when using Database Cleaner in tests, create a second local test database.

```ruby
# .env.test

DATABASE_URL=postgres://localhost/application_test
```

Overwrite the shell environment with any test-specific variables and clear the Active Record configuration before loading the ruby environment. *(This one really bit me.)*

```ruby
# Rakefile

task :environment do
  if ENV['RACK_ENV'] == 'test'
    Dotenv.overload('.env.test') 
    ActiveRecord::Base.configurations = {}
  end
  require_relative 'config/environment'
end
```

### Scaffolding

I haven't found a good substitute for scaffolding, but I also rarely used it. Usually something would need an to be not null or indexed, and then you need to write the migration anyway. Creating the filenames and migration structure can help tho.

```ruby
#!/usr/bin/env ruby

# bin/migration

require 'date'
require 'active_support/core_ext'

system "mkdir -p db/migrations"

date = Date.today.strftime('%Y%m%d')
name = ARGV.join('_')

file = <<FILE
class #{name.camelize} < ActiveRecord::Migration
  def change
    
  end
end
FILE

filename = "db/migrations/#{date}_#{name}.rb"

File.open(filename, 'w') do |f|
  f.puts file
end
```

To use the helper command make it executable.

```sh
$ chmod +x bin/migration
$ bin/migration create users
```

### Rackup

The last step is to start the server. Sintra, Grape, etc are rack applications meaning they can be run in a rack up config file.

```ruby
# config.ru

require_relative 'config/environment'

# websites need CORS
use Rack::Cors do
  allow do
    origins '*'
    resource '*', headers: :any, methods: [
      :head, :options, :get, :post, :patch, :put, :delete
    ]
  end
end

run API
```

That's it. Tweet [@aj0strow](https://twitter.com/aj0strow) with comments, questions, and especially constructive criticism. 
