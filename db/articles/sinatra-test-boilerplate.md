For my latest project, I'm using DataMapper. If you're using it too, then go check out [dm-sweatshop](https://github.com/datamapper/dm-sweatshop) cause you'll want it. Anyway...

To make your test_helper.rb easy to require, here is what your rake testtask could look like:

```ruby
# Rakefile

require 'rake/testtask'
require 'sinatra/assetpack/rake'

Rake::TestTask.new do |t|
  t.libs << 'test'
  t.pattern = 'test/**/*_test.rb'
end
```

### Require Everything

The first step to the test helper is to require everything. Make sure to set the test environment before requiring your main app file. You may need to require ORM specific files as well.

```ruby
# test/test_helper.rb

require 'rack/test'
require 'minitest/autorun'

ENV['RACK_ENV'] = 'test'

require_relative '../app'
require_relative 'fixtures'   # or 'factories', whatever
```

### Helpers Module

The next thing to add is a module to define test helpers which offer some syntactic sugar. Here's a basic one:

```ruby
# test/test_helper.rb

module TestHelpers
  module ClassMethods
    
    def test(name, &block)
      test_name = name.split.unshift('test').join('_')
      define_method test_name, &block
    end
    
    def setup(&block)
      define_method 'setup', &block
    end
    
  end
  def self.included(base)
    base.extend ClassMethods
  end
end
```

### Subclass TestCase

For no other reason than writing out MiniTest::Unit::TestCase sucks (believe me, I just experienced the hurt) its easier to work exclusively with a subclass just called Test. Turns out thats useful for integration with rack test helpers as a bonus.

I added a sample omniauth sign_in method to this example, which will either sign in the user passed to it, or create a new user from a fixture / factory, and sign that in. You may need to change User.gen, for example factory_girl would use FactoryGirl.create(:user).

```ruby
# test/test_helper.rb

class Test < MiniTest::Unit::TestCase
  include Rack::Test::Methods
  include TestHelpers   # see above
  
  def app
    Namespace::App   # or Sinatra::Application
  end
  
  def sign_in(user = User.gen)
    auth_hash = {
      'uid' => SecureRandom.hex(20),
      'provider' => 'test',
      'info' => {
        'email' => user.email,
        'name' => user.name,
        'nickname' => user.nickname
      }
    }
    get '/auth/test/callback', nil, { 'omniauth.auth' => auth_hash }
  end
end
```

### Write Tests

That's all for the boilerplate, now your test files should be looking gooood.

```ruby
# test/unit/user_test.rb

require 'test_helper'

class UserTest < Test
  
  setup do
    @user = User.gen
  end
  
  test 'nickname unique' do
    other_user = User.gen
    @user.nickname = other_user.nickname
    refute @user.save
  end

  test 'GET user profile' do
    get "/users/#{@user.nickname}/profile"
    assert last_response.successful?
  end

end
```