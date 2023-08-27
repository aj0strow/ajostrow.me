I recently added client-side authorization to this site, and it was a minor nightmare, so I'll lay out the baby steps to get it working. I'll assume you already have a Rails app ready for adding authentication.

### Facebook

The first step is to make an application on Facebook. Log in to facebook with your account, or whichever account should own the app, go to developers.facebook.com, and click on Apps. Then click on Create new app, choose a name and namespace.

![Facebook Create New App Screenshot][facebook-new]

In Facebook, check 'Website with Facebook login', and put the url that your local Rails server points to. For me it was http:0.0.0.0:3000. Turning on Sandbox mode has caused problems for many people online, so maybe leave it off.

### OmniAuth Setup

Add the OmniAuth gem to your gemfile.

```ruby
# Gemfile

gem 'omniauth-facebook', '1.4.0'
```

And then run bundle install

```
$ bundle install
```

Now there is some setup required for facebook integration, which is what initializers are for. To pass in the facebook-id and facebook-secret-id, we will use environment variables. An easy way to have local environment variables is to add another initializer which is not committed to version control.

Note you could call the environment variables anything as long as you are consistent. FACEBOOK_API_KEY and FACEBOOK_APP_SECRET would work just as well.

```ruby
# config/initializers/app_environment_variables.rb

ENV['FACEBOOK_APP_ID'] = 'COPY_AND_PASTE_APP_ID_FROM_FACEBOOK_HERE'
ENV['FACEBOOK_SECRET'] = 'COPY_AND_PASTE_THE_APP_SECRET_TOO'
```

Make sure the initializer file is not put in version control for the world to see.

```
# .gitignore
...

/config/initializers/app_environment_variables.rb
```

Now you can add and commit files again. You must also add the environment variables to the production environment. My app is on Heroku, and for that you use the config command.

```
$ heroku config:add FACEBOOK_APP_ID=ID_GOES_HERE
$ heroku config:add FACEBOOK_SECRET=SECRET_GOES_HERE
```

To check if the adding worked and is what you expected, or to just see all your environment variables with heroku run the following:

```
$ heroku config
```

Moving along, the actual OmniAuth initializer. There is some weird behavior with CA certificates which Facebook requires, so you may encounter some issues with that. If you do, scour the internet for solutions- at least you know what you're looking for.

Below is my initializer. First you set the logger so you get debug messages, and second you pass in the environment variables we just set to OmniAuth.

```ruby
# config/initializers/omniauth.rb

OmniAuth.config.logger = Rails.logger

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :facebook, ENV['FACEBOOK_APP_ID'], ENV['FACEBOOK_SECRET'], {
    client_options: { ssl: {
        ca_file: '/usr/lib/ssl/certs/ca-certificates.crt',
        ca_path: "/etc/ssl/certs"
    }}
  }
end
```

### Sessions Controller

To keep track of users signing in and out, it is common to use a sessions controller, so lets make one.

```
$ rails generate controller Sessions
```

And then modify the controller to create and destroy sessions. Here's my original controller.

```ruby
# app/controllers/sessions_controller.rb

class SessionsController < ApplicationController

  def create
    session[:user] = request.env["omniauth.auth"]
    redirect_to root_path
  end

  def destroy
    session[:user] = nil
    redirect_to root_path
  end

end
```

We also need to update the routes to include the sessions controller actions. Again routes may vary, but here's mine.

```ruby
# config/routes.rb
...

match 'auth/:provider/callback', to: 'sessions#create'
match 'auth/failure', to: redirect('/')
match 'signout', to: 'sessions#destroy', as: 'signout'
```

I also added a helper method to the app controller so I can call current_user in the views themselves.

```ruby
# app/controllers/application_controller.rb

class ApplicationController < ActionController::Base

  helper_method :current_user

  ...

  private

    def current_user
      @current_user ||= session[:user]
    end

end

```

### Client-side Authentication

For my authentication, I chose to make it purely client-side and I actually don't have a User model.

Regardless, you need a login button for unauthenticated users, and logout button once the user is signed in. I gave the login button an id of 'sign_in' and the logout button an id of 'sign_out'.

Various resources suggest putting the facebook div before all other content on the page, and putting the script right after it. I made a partial in layouts to hold the markup and script.

```erb
<!-- app/views/layouts/_facebook.html.erb -->

<div id="fb-root"></div>

<script type="text/javascript">
$(document).ready(function() {

    window.fbAsyncInit = function() {
        FB.init({
            appId :  <%= ENV["FACEBOOK_APP_ID"] %>,
            status:  true,
            cookie:  true,
            xfbml :  false
        });
    };

    (function() {
        var e = document.createElement('script');
        e.async = true;
        e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
        document.getElementById('fb-root').appendChild(e);
    }());

    // Assign onclick listeners to login/logout buttons

    $('#sign_in').click(function(e){
        e.preventDefault();
        FB.login(function(response){
            if(response.authResponse){
                window.location = '/auth/facebook/callback';
            }
        });
    });

    $('#sign_out').click(function(e){
        FB.getLoginStatus(function(response){
            if(response.authResponse){
                FB.logout();
            }
        });
    });

});
</script>
```

The code above asynchronously initializes the Facebook client-side authentication system, writes a script to the document, and then adds onclick listeners to the `sign_in` and `sign_out` buttons. I mentioned before those are the IDs of my buttons.

Render it in the application layout.

```erb
# app/views/layouts/application.html.erb

...

<body>

   <%= render 'layouts/facebook' %>

...
```

At this point, client-side facebook login should be working in development. There are a couple more steps though.

### Friendly Redirects

It is really annoying to sign in, and then be redirected to the root path each time, so lets change that. We'll save the previous request to access it when we redirect.

```ruby
# app/controllers/application_controller.rb
...

before_filter :save_location

private
...

  def save_location
    session[:previous_url] = session[:current_url]
    session[:current_url] = request.fullpath
  end
```

And in the sessions controller lets update the target paths.

```ruby
# app/controllers/sessions_controller.rb

class SessionsController < ApplicationController

  def create
    session[:user] = request.env["omniauth.auth"]
    redirect_to previous_url
  end

  def destroy
    session[:user] = nil
    redirect_to previous_url
  end

  private

    def previous_url
      session[:previous_url] || root_path
    end

end
```

### Facebook configuration with custom domain and GoDaddy

The final step for me was to get authentication working with a custom domain. Assuming you own the domain in question, its time to set everything up to use it.

In the Facebook app Basic Info, add the custom domain to the App Domains field; like ajostrow.me. Also change the Site URL to refer back to the custom domain, such as http://www.ajostrow.me.

Also add the custom domain to Heroku. Heres the command I used but use your domain.

```
$ heroku domains:add www.ajostrow.me
```

Finally with GoDaddy or whichever domain name registrar you use, you need to set CNAMES and forwarding.

![GoDaddy Forwarding and CNAME][godaddy]

First forwarding. Have the domain itself point to the www subdomain. For example, I chose forward-only with ajostrow.me going to http://www.ajostrow.me. If you use domain masking, it won't work.

Go into the DNS manager, and set the www subdomain to point to the Heroku app. For instance my CNAME record is Host: www, Points to: ****\*****.herokuapp.com. I didn't need any other records in my zone file so I deleted the ones besides '@' which is the domain itself to my knowledge and shouldn't be messed with.

Well that's everything. I hope this helped, and be sure to check out the official documentation for OmniAuth if you want to actually store users in a database.

[facebook-new]: https://fbcdn-sphotos-e-a.akamaihd.net/hphotos-ak-ash3/s720x720/601643_10151229455297269_107823388_n.jpg 'Hosting with Heroku can be done through GitHub as well'
[godaddy]: https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-ash4/s720x720/419312_10151229509407269_1262379414_n.jpg 'Forwarding and CNAME'
