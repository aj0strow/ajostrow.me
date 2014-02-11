If you develop apps with Ruby on Rails, and need to register users, Devise has been a popular choice for managing registration and user accounts. There are a ton of articles out there for how to get things working, but I'll add one more to the literature on the subject anyway.

I'm assuming you have a Rails app, but no Users model yet. If you do, just destroy it and add the necessary fields later. To destroy your whole database (if necessary), delete all of the files in db/migrations and then run the following:

```
$ bundle exec rake db:drop db:create db:migrate
```

### Installing Devise

The first thing to do is to install the gem. 

```ruby
# Gemfile

gem 'devise'
```

```
$ bundle install
$ rails generate devise:install
```

Now Devise will give you some instructions. Follow them. I did the following: 

```ruby
# config/environments/development.rb

config.action_mailer.default_url_options = { host: 'localhost:3000' }
```

Make sure you have a root path in your routes file. Mine points to the home action of my static controller. 

```ruby
# config/routes.rb

root to: 'static#home'
```

Next the instructions suggest that flash messages are actually shown in the view. Add something along the lines of my flash messages (simplified). 

```erb
<!-- app/views/layouts/application.rb -->

<% flash.each do |key, value| %>
    <div class="alert alert-<%= key %>">
        <%= value %>
    </div>
<% end %>
```

### The Devise Modules

Devise is made up of 12 fantastic modules, described by [the official devise site](http://devise.plataformatec.com.br/) as the following:

* Database Authenticatable: encrypts and stores a password in the database to validate the authenticity of a user while signing in. The authentication can be done both through POST requests or HTTP Basic Authentication.

* Token Authenticatable: signs in a user based on an authentication token (also known as "single access token"). The token can be given both through query string or HTTP Basic Authentication.

* Omniauthable: adds Omniauth (https://github.com/intridea/omniauth) support.

* Confirmable: sends emails with confirmation instructions and verifies whether an account is already confirmed during sign in.

* Recoverable: resets the user password and sends reset instructions.

* Registerable: handles signing up users through a registration process, also allowing them to edit and destroy their account.

* Rememberable: manages generating and clearing a token for remembering the user from a saved cookie.

* Trackable: tracks sign in count, timestamps and IP address.

* Timeoutable: expires sessions that have no activity in a specified period of time.

* Validatable: provides validations of email and password. It's optional and can be customized, so you're able to define your own validations.

* Lockable: locks an account after a specified number of failed sign-in attempts. Can unlock via email or after a specified time period.

### Creating Users

Create the user model for the site. Usually you want that to be User, but it could easily be another noun that better describes every user. 

```
$ rails generate devise User
```

Then open up the newly created migration file in db/migrate/**********_devise_create_users.rb. Uncomment as many of the lines as necessary to include all of the modules you want. Below is mine.

```ruby
class DeviseCreateUsers < ActiveRecord::Migration
  def change
    create_table(:users) do |t|
      ## Database authenticatable
      t.string :email,              :null => false, :default => ""
      t.string :encrypted_password, :null => false, :default => ""

      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Trackable
      t.integer  :sign_in_count, :default => 0
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string   :current_sign_in_ip
      t.string   :last_sign_in_ip

      ## Confirmable
      t.string   :confirmation_token
      t.datetime :confirmed_at
      t.datetime :confirmation_sent_at
      t.string   :unconfirmed_email

      ## Lockable
      t.integer  :failed_attempts, :default => 0 # Only if lock strategy is :failed_attempts
      t.string   :unlock_token # Only if unlock strategy is :email or :both
      t.datetime :locked_at

      ## Token authenticatable
      t.string :authentication_token

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :confirmation_token, unique: true
    add_index :users, :unlock_token, unique: true
    add_index :users, :authentication_token, unique: true
  end
end
```

And then of course migrate the database. 

```
$ bundle exec rake db:migrate
```

### Routes

Setting up routes is an important step, because otherwise, well, you can't access anything. Here are my routes with some customizations. 

```ruby
# config/routes.rb
  devise_for :users, 
    path: '',
    path_names: {
      sign_in: 'login',
      sign_out: 'logout',
      sign_up: 'register'
    }

  resources :users
```

These are the url helpers that devise_for generates: 

```ruby
new_session_path(:user)       => new_user_session_path
session_path(:user)               => user_session_path
destroy_session_path(:user)  => destroy_user_session_path

new_password_path(:user)    => new_user_password_path
password_path(:user)            => user_password_path
edit_password_path(:user)     => edit_user_password_path

new_confirmation_path(:user)  => new_user_confirmation_path
confirmation_path(:user)         => user_confirmation_path
```

### Devise helper

Sometimes you need to access the devise variables in your own views. For instance, imagine you wanted to put a sign in form on the hom page. To access them, make a devise helper. 

```ruby
# app/helpers/devise_helper.rb

module DeviseHelper
  
  def resource_name
    :user
  end

  def resource
    @resource ||= User.new
  end

  def devise_mapping
    @devise_mapping ||= Devise.mappings[:user]
  end
  
end
```

And add it as a helper in your application controller.

```ruby
# app/controllers/application_controller.rb

  helper DeviseHelper
```

### Registration and Sign in forms

First, generate the devise views so you can modify them (and at least see them!)

```
$ rails generate devise:views
```

Here is a simple working sign in form for reference. Note that I pass in true for :remember_me as a hidden field, which means the user's credentials will be saved to a cookie. Usually that is left as an optional checkbox. 

```erb
<%= form_for resource, as: resource_name, 
               url: session_path(resource_name) do |f| %>
  
  <%= f.email_field :email %>
  
  <%= f.password_field :password %>
  
  <%= f.hidden_field :remember_me, value: true %>
  
  <%= f.submit 'Login' %>
	
<% end %>
```

For the sign up form, I had the issue that it did not point to the right url. When making a post request to create a new user, assuming you have RESTful routes, you need to point to the resource collection. For instance if we have a User model, it needs to point to /users. For whatever reason, the post requests weren't working, so I simply passed in the path I wanted. 

Note that I have a name field. This is an extra field I added and is not default with working with devise. Either delete it, or add a string field to your User model called :name.

```erb
<%= form_for resource, as: resource_name, url: users_path do |f| %>
  
  <%= f.text_field :name %>

  <%= f.email_field :email %>
  
  <%= f.password_field :password %>

  <%= f.password_field :password_confirmation %>
  
<% end %>
```

### Testing registration with confirmable

To test the confirmable registration flow in an integration test, the easiest way I've found is the following order of requests:

```ruby
get '/users/sign_up'
post '/users', user: { email, password, etc }

# grab the new user
@user = User.find_by_email(user_email)

# Set the confirmation token
token = 'liajefliahf8h3foaihf0932fhasdfh'
@user.update_attribute(:confirmation_token, token)

get '/users/confirmation', confirmation_token: token

# get an authentication action, make sure you're not redirected
get "/users/#{@user.id}/edit"
assert_response :success
```

### Opening email in development mode

Viewing email is pretty important, especially if you need to see it to register an account. Check out [Letter Opener](https://github.com/ryanb/letter_opener) by ryanb and follow the steps to set it up below.

```ruby
# Gemfile

group :development do
  gem 'letter_opener'
end
```

```
$ bundle install
```

Add the following line to the development environment configuration, and that's it! Don't forget to restart your server every time you change something in /config. 

```ruby
# config/environments/development.rb

config.action_mailer.delivery_method = :letter_opener
```

User registration should now work in development mode! Getting it to work in production mode needs a little more effort. 

### Gmail

There are tons of posts about using gmail to send emails with rails. Check out this for instance:

[Stackoverflow post on getting it to work](http://stackoverflow.com/questions/5933969/getting-devise-1-3-4-to-send-emails-with-gmail-in-development)

### Heroku

Here are the steps I took to get it working:

```ruby
# config/environments/production.rb

  config.action_mailer.default_url_options = { host: 'your-domain.com' }
```

```ruby
# config/initializers/mail.rb

if Rails.env.production?
  
  ActionMailer::Base.smtp_settings = {
    :address        => 'smtp.sendgrid.net',
    :port           => '587',
    :authentication => :plain,
    :user_name      => ENV['SENDGRID_USERNAME'],
    :password       => ENV['SENDGRID_PASSWORD'],
    :domain         => 'heroku.com'
  }
  ActionMailer::Base.delivery_method = :smtp
  
end
```

Don't forget to add the environment variables to heroku as well. 

```
$ heroku config:add SENDGRID_USERNAME=put-username-here
$ heroku config:add SENDGRID_PASSWORD=put-password-here
```

```ruby
# config/devise/initializers.rb

  config.mailer_sender = "accounts@your-domain.com"
```