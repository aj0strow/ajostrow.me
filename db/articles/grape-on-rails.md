Applications always end up on the client, and the transition for a Rails app can be painful. **[Grape](https://github.com/intridea/grape)** makes it fun. 

```
# Gemfile

gem 'grape'
gem 'grape-entity'
```

And install.

```
$ bundle install
```

### Setup

Create a new app/api folder to hold the api. It can all go in one file to begin, but eventually you might want to separate them out into v1, v2, etc. The api must specify json format, otherwise it doesn't know to call `to_json` on objects returned by the endpoint. 

```
# app/api/api.rb

class API < Grape::API
  format :json
  default_format :json

  module ErrorFormatter
    def self.call(message, backtrace, options, env)
      API.logger.error(backtrace.join("\n"))
      { status: 500, message: message }.to_json
    end
  end

  rescue_from :all
  error_formatter :json, ErrorFormatter
  default_error_formatter :json
end
```

The custom error formatter is needed to log the backtrace. Otherwise there will just be the request logged, which makes it impossible to fix the problem. 

```
method=GET host=www.domain.com connect=1 service=168 status=500 bytes=372
```

Add the api folder to the autoload paths so that the constant `API` can be found and loaded on invocation (so it just works).

```ruby
# config/application.rb

  config.autoload_paths << root.join('app/api')
```

The last step is to mount the api. You can do it with a subdomain or path.

```ruby
# config/routes.rb

  mount API => '/api'

  # or

  constraints(subdomain: 'api') do
    mount API => '/'
  end
```

You'll also likely want to include the application helper.

```ruby
# app/api/api.rb

  helpers ApplicationHelper
```

### RSpec Configuration

You're a ruby developer so you love testing. Let's set that up and test a ping endpoint.

```ruby
# app/api/api.rb

  get 'ping' do
    { ping: 'pong' }
  end
```

We need to manually include the module to allow rack request http verbs. 

```ruby
# spec/helper.rb

module Helpers
  def json
    MultiJson.load(response.body)
  end
end

RSpec.configure do |config|
  config.include RSpec::Rails::RequestExampleGroup,
    type: :request, file_path: /spec\/api/
  config.include Helpers
end
```

Alright. Now we can make requests in a test.

```ruby
# spec/api/api_spec.rb

describe API do
  describe 'GET /ping' do
    before { get '/api/ping' }
    it 'should return pong' do
      expect(json['ping']).to eq('pong')
    end
  end
end
```

The test suite should pass.

```
$ alias 'rspec'='RAILS_ENV=test bundle exec rspec'
$ rspec
```

### Base Entity

Check out **[grape-entity](https://github.com/intridea/grape-entity)**, a vast improvement over JBuilder for resource rendering. It's useful to use a base entity and extend it for each resource representation. 

```ruby
# app/api/api.rb

class API < Grape::API
  class Entity < Grape::Entity
  end

  class UserEntity < Entity
  end
end
```

Functionality included in the base entity extends to each resource entity necessarily through inheritance, so give it some power. Let's start with some `format_with` helpers.

```ruby
class Entity < Grape::Entity
  [ :iso8601, :to_s, :count ].each do |sym|
    format_with(sym, &sym)
  end
end
```

This allows you to use these formatters in every other entity, for example for timestamps and posts count.

```ruby
class UserEntity < Entity
  expose :id, format_with: :to_s
  expose :posts, as: :posts_count, format_with: :count
  with_options(format_with: :iso8601) do
    expose :created_at, :updated_at
  end
end
```

Formatters are pretty useful. For example you can do truncation just like in erb views.

```ruby
class Entity
  include ActionView::Helpers::TextHelper

  format_with(:truncate) do |string|
    truncate(string.gsub(/\s+/, ' '), length: 140, separator: ' ')
  end
end
```

Also, for url helpers such as `resource_url(@resource)`, we need to manually deal with the url options host.

```ruby
class Entity
  include Rails.application.routes.url_helpers

  def default_url_options
    Rails.application.routes.default_url_options
  end
end
```

Each environment needs to be manually updated with the correct host as well.

```ruby
# config/environments/production.rb

  routes.default_url_options = { host: 'www.domain.com' }

# config/environments/development.rb

  routes.default_url_options = { host: 'localhost', port: 3000 }

# config/environments/test.rb

  routes.default_url_options = { host: 'local.test' }
```

Tweet if you need help [@aj0strow](https://twitter.com/aj0strow). Thanks for reading. 
