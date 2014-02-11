Lots of logic is repeated when writing an API. In this case I'll lay out a bunch of helpers to be used in a Sinatra app. The end goal is to quickly build out API endpoints like this:

```ruby
get '/models.json' do
  show{ Model.all }
end

post '/models.json' do
  create{ current_user.models.new }
end

put '/models/:id.json' do
  update{ current_user.posts.get(params[:id]) }
end

delete '/models/:id.json' do
  destroy{ current_user.models.get(params[:id]) }
end
```

### Basic Error Handling

There are some basic errors that must be accounted for by APIs- the model wasn't found, no user is signed in, or the model doesn't belong to the user.

```ruby
helpers do

  def assert!(resource)
    halt 404 unless resource
  end
        
  def assert_signed_in!
    halt 401 unless signed_in?
  end

  def assert_owner_of!(resource)
    assert! resource
    halt 403 unless resource.user == current_user
  end

end
```

### Saving Records to the Database

Saving records actually has a ton of complexity, given the myriad validations possible with most ruby ORMs, and the many indexing constraints also available. For this reason I went with a persistence helper. 

```ruby
  def persist(resource)
    if resource.save
      status (resource.saved? ? 200 : 201)
      json resource
    else
      show_errors_for resource
    end
  end
        
  def show_errors_for(resource)
    status 422
    json resource.errors
  end
```

### Controller Actions

Finally the controller actions. For uniformity, each accepts a block. This is useful, because then you can use halting helpers before and after the actual block call, allowing resources to be scoped to the current_user. 

```ruby
  def show
    resource = yield
    assert! resource
    status 200
    json resource
  end
        
  def create
    assert_signed_in!
    resource = yield
    resource.attributes = params
    persist resource
  end
        
  def update
    assert_signed_in!
    resource = yield
    assert_owner_of! resource
    resource.attributes = params
    persist resource
  end
        
  def destroy
    assert_signed_in!
    resource = yield
    assert_owner_of! resource
    if resource.destroy
      status 200
      json resource
    else
      show_errors_for resource
    end
  end
```

The actual method names and implementation vary across framework choices, but the basic idea is that passing a block that returns the resource allows much DRYer code. Supporting each new resource takes about 12 lines of code, with unlimited customization opportunities. 