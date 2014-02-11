It's convenient to organize settings into named yaml files. However, Rails needs a monkey-patch to allow clean syntax and optional environment specificity.

### Example

HTTP Basic Authentication for admin controllers.

```yaml
# config/settings/admin.yml

production:
  authenticated: false
  username: admin
  password: 8hof9aw8hflkajbsdlawehlaubfla

development:
  authenticated: true

test:
  authenticated: true
```

In the controller, an http_authenticate before filter method. 

```ruby
require 'yaml'

def http_authenticate
  admin_yml = Rails.root.join('config/settings/admin.yml')
  admin = YAML.load_file(admin_yml)[Rails.env]
  authenticate_with_http_basic do |user, pass|
    admin['authenticated'] or 
    admin['username'] == user && admin['password'] == pass
  end
end
```

In the production environment, the admin controllers are protected, and in development and testing you don't need to worry about authentication.

### Improvements

It's a little annoying to repeat default settings in the yaml. The following is just as clear to me, and has fewer lines of code. It also supports arbitrarily many environments beyond development and test. 

```yaml
# before

development:
  authenticated: true

test:
  authenticated: true

# after

authenticated: true
```

It's also a pain to write out the whole yaml file loading line. If I have many different settings, it could be repeated many times in the application. A helper would be much nicer.

```ruby
# before

admin_yml = Rails.root.join('config/settings/admin.yml')
admin = YAML.load_file(admin_yml)[Rails.env]

# after

admin = Rails.yaml(:admin)
```

### The Code

Tons of comments!

```ruby
# YAML starts off undefined
require 'yaml'

module Rails
  class << self

    # name will be a symbol or string. ex: :admin
    def yaml name

      # :admin  ->  'admin.yml'
      filename = "#{name}.yml"

      # 'admin.yml'  ->  ~/code/appname/config/settings/admin.yml
      path = root.join configuration.yaml, filename

      # ~/code/appname..  ->  { 'production' => { .. }, .. }
      config = YAML.load_file path

      # { 'production' => { .. }, .. }  ->  { .. }
      config.fetch Rails.env, config
    end
    
    alias_method :yml, :yaml
  end
  
  # if config.yaml has already been set, don't override it
  unless configuration.respond_to? :yaml

    # fallback to config if config/settings doesn't exist
    configuration.yaml = %w(config/settings config).find do |path|
      Dir.exists? root.join(path)
    end
  end
end
```

The whole thing is on github with specs as well: https://github.com/aj0strow/rails-yaml