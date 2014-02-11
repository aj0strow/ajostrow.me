Sinatra is a very cool ruby web framework, but I keep coming up with little issues. Might as well blog them, right?

### Modularity

The best way I've found to build a modular app is, well, with modules. Here's how I organize it. File structure:

```
+ app.rb
- lib
  + authentication.rb
  + assets.rb
  + models.rb
```

In your application "app.rb" file:

```ruby
require 'sinatra/base'
Dir.glob('lib/**/*.rb'){ |lib| require_relative lib }

module Application
  class App < Sinatra::Base

    ...

    register Assets, Models, Authentication

  end
end
```

And your module follows the following convention:

```ruby
# require any external libs here

require 'sinatra/assetpack'

module Application
  module Assets

    def self.registered(app)
      # app refers to the main app here, so you can set variables, 
      # register other extensions, etc.

      app.register Sinatra::AssetPack
    end

  end
end
```

### Config

Make sure you do not use reserved configuration keys for your own custom modules. For example, if you wanted to set a templates directory for automatically gathering templates into the client, you'd maybe think it was a good idea to set "templates" to the directory in views. Dont do that!

To check if a config variable name is reserved, do in your module:

```ruby
  def self.registered(app)
    puts app.settings.respond_to?(:variable_name)
  end
```

If it comes out true, choose a different name. 

### Quiet Assets

There is no convenient gem to turn off asset logging with Sinatra, so I wrote a little module you can register like so:

```ruby
configure :development do
  register Sinatra::QuietAssets
end
```

Grab a copy on Github: https://github.com/aj0strow/sinatra-quiet-assets

### JSON Request Data

If you're building an app with Backbone.js, then raw JSON is sent as the data of POST, PUT, and PATCH requests. This means they do not show up in the params for the route action.

Here's a little extension that fixes that: https://github.com/aj0strow/sinatra-json-body-params
