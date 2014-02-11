3rd party registration is great for quickly prototyping, but eventually an email / password sign up feature will be requested.

### omniauth-identity

A great gem for doing this already exists, called [omniauth-identity](https://github.com/intridea/omniauth-identity). The idea behind the gem is golden: have traditional registration act exactly like other providers, and mimic the [auth_hash schema](https://github.com/intridea/omniauth/wiki/Auth-Hash-Schema). More specifically, for each User, there is the possibility of one Identity (which mimics the data provided by Facebook on login), and many Auths, one Auth per connected account (facebook, twitter, identity, etc.)

However, the gem has its limitations, namely after 5 hours I couldn't figure out how to go through the OmniAuth stages without actually rendering pages. The solution I found was to use the built-in Identity model, and choose not to use the actual middleware. More concretely: 

```ruby
require 'omniauth-identity'

# and *not* the middleware below

use OmniAuth::Builder do
  provider :identity, fields: [:email]
end
```

### Identity Model

When rolling your own anything, tests are paramount. To set up each test we'll create a persisted Identity object, with the fields we want. First things first, a fixture (I use [dm-sweatshop](https://github.com/datamapper/dm-sweatshop).) 

```ruby
# test/fixtures.rb

include DataMapper::Sweatshop::Unique

Identity.fix {{ 
  email: unique(:email){ /\w+\@modreal\.com/.gen },
  password: (password = /\w{6,8}/.gen),
  password_confirmation: password
}}
```

We'll use that fixture to start with a fresh valid record for each test. 

```ruby
# test/unit/identity_test.rb

require 'test_helper'

class IdentityTest < Test

  setup do
    @identity = Identity.gen
  end

  test 'email required' do
    @identity.email = nil
    refute @identity.save
  end
  
  test 'email unique' do
    other = Identity.gen
    @identity.email = other.email
    refute @identity.save
  end

end
```

And creating the basic model:

```ruby
# lib/models/identity.rb

require 'data_mapper'
require 'omniauth-identity'

class Identity
  include DataMapper::Resource
  include OmniAuth::Identity::Models::DataMapper

  property :id, Serial
  property :email, String, required: true, unique_index: true
  property :password_digest, Text
  
  validates_uniqueness_of :email

  attr_accessor :password_confirmation
end
```

The unique index is very important to preserve data integrity and allow for performant look-ups when users are logging in. The validation of uniqueness is also necessary so that duplicates are caught before they raise exceptions at the persistance layer. 

### Authenticating Identities

After poking around the [identity model source code](https://github.com/intridea/omniauth-identity/blob/master/lib/omniauth/identity/model.rb) a little bit, and looking at authenticate, it becomes clear that there are two authentication methods:

```ruby
# record authenticate
@identity.authenticate(password)

# table authenticate
Identity.authenticate(options, password)
```

Where "options" are used to find the model, and then call authenticate on it. Also looking at the [secure password source code](https://github.com/intridea/omniauth-identity/blob/master/lib/omniauth/identity/secure_password.rb) it's clear that the password is turned into a password_digest. So some tests:

```ruby
# test/unit/identity_test.rb

  test 'password digest required' do
    @identity[:password_digest] = nil
    refute @identity.save
  end
  
  test 'password required' do
    @identity = Identity.new email: @identity.email
    refute @identity.save
  end
  
  test 'password authentication' do
    assert @identity.authenticate(@identity.password)
  end
  
  test 'identity authentication' do
    assert_equal @identity, Identity.authenticate({ email: @identity.email }, 
      @identity.password)
  end
  
  test 'identity bogus auth' do
    refute Identity.authenticate({ email: nil }, 'password')
  end
```

Those are actually all sanity checks. The gem covers all of that!

### Integrating With Omniauth

So far we can create a new identity pretty well, but what about authenticating or creating a user with it? To start, there must be two post request endpoints, as the default omniauth-identity uses forms to submit data. 

```
POST /auth/identity/register
POST /auth/identity/callback
```

We'll need some integration / controller tests. The "json" helper method is equivalent to the body of the last response parsed as JSON. 

```ruby
# test/integration/authentication_test.rb

require 'test_helper'

class AuthenticationTest < Test
  
  setup do
    @user = User.gen
  end
  
  test 'sign in' do
    Identity.create email: @user.email, password: (password = /\w+/.gen),
      password_confirmation: password
    post '/auth/identity/callback', email: @user.email, password: password
    assert_equal @user.id, json['id']
  end
  
  test 'sign in wrong email' do
    post '/auth/identity/callback', email: @user.email, password: /\w+/.gen
    assert last_response.client_error?
  end
  
  test 'sign in wrong password' do
    Identity.create email: @user.email, password: (password = 'password-1'), 
      password_confirmation: password
    post '/auth/identity/callback', email: @user.email, password: 'password-2'
    assert last_response.client_error?
  end
  
  test 'omniauth identity' do
    email = unique(:email){ /\w+\@modreal\.com/.gen }
    post '/auth/identity/register', { email: email, password: (password = /\w+/.gen),
      password_confirmation: password }
    assert_equal email, json['email']
  end
  
  test 'omniauth identity duplicate email' do
    Identity.create email: @user.email, password: (password = /\w+/.gen), 
      password_confirmation: password
    post '/auth/identity/register', { email: @user.email, password: password,
      password_confirmation: password }
    assert last_response.client_error?
  end
  
end
```

For implementing this, it's important to realize the easiest way to go is once the Identity is created, turn it into an auth_hash, and process it just like any other provider. 

### Authentication Helpers

Here are some authentication helpers to make it very easy to sign users in and out:

```ruby
# app.rb

helpers do
  def signed_in?
    !!current_user
  end
        
  def current_user
    @current_user ||= User.get(session[:user_id]) if session[:user_id]
  end
        
  def sign_in(user)
    session[:user_id] = user.id
    @current_user = user
  end

  def sign_out!
    session[:user_id] = nil
    @current_user = nil
  end
end
```

For Omniauth, there are two more useful ones:

```ruby
# app.rb

helpers do
  def auth_hash
    request.env['omniauth.auth']
  end

  def omniauth_with(hash)
    @auth = Auth.get_or_create_from_hash(hash, current_user)
    sign_in(@auth.user) unless signed_in?
    json current_user
  end
end    
```

The get_or_create_from_hash is based on this [rails rumble blog](http://blog.railsrumble.com/2010/10/08/intridea-omniauth/). I'm assuming you're reading this because you already have a provider working, and wanted email / password in addition.

### Turning Identity into Auth Hash

Firstly, Identity must act like an auth_hash for authentication. In typical ruby fashion when converting between objects, we'll make a to_* method. To test it:

```ruby
# test/unit/identity_test.rb

  test 'nickname is beginning of email' do
    @identity.email = 'cool-stuff@gmail.com'
    assert_equal 'cool-stuff', @identity.nickname
  end

  test 'to auth hash' do
    auth_hash = {
      'uid' => @identity.id,
      'provider' => 'identity',
      'info' => {
        'email' => @identity.email,
        'nickname' => @identity.nickname
      }
    }
    assert_equal auth_hash, @identity.to_auth_hash
  end
```

And update the Identity model to make those pass (note "info" is a method provided by the gem):

```ruby
# lib/models/identity.rb

  def nickname
    email and email.split('@').first
  end
  
  def to_auth_hash
    { 'uid' => id, 'provider' => 'identity', 'info' => info }
  end
```

### Implementing The Actions

We're finally ready to get the integration tests passing, which concludes the article! 

```ruby
# app.rb

get '/auth/:provider/callback' do
  omniauth_with auth_hash
end
      
post '/auth/identity/callback' do
  @identity = Identity.authenticate({ email: params[:email] }, 
    params[:password])
  halt 422 unless @identity
  omniauth_with @identity.to_auth_hash
end
      
post '/auth/identity/register' do
  @identity = Identity.new params
  if @identity.save
    omniauth_with @identity.to_auth_hash
  else
    status 422
    json @identity.errors
  end
end
```

Not all together trivial, but certainly simpler than doing the whole thing from scratch, and this way you are not tied to html request - response cycles to get a user signed in.