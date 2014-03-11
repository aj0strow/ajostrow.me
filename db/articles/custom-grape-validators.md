[Grape](https://github.com/intridea/grape) the api framework allows parameter validation. However, grape only ships with `presence`, `values`, `regexp`, type coersion and defaults. 

### How Validators Work

Grape matches the validation symbol option to a class. So in a params block:

```ruby
params do
  requires :text, presence: true
end
```

Means that the `Grape::Validations::Presence` validator will be passed the option `true`, whether or not it was required, the params and attribute name `:text`. 

### Length

I wanted a validator to guarantee a length of two for a longitude-latitude coordinate pair, a type of coordinates supported by Mongo's geospacial index. 

```ruby
module Grape::Validations
  class Length < SingleOptionValidator
    def validate_param!(attr_name, params)
      unless @option === params[attr_name].try(:length)
        args = {
          param: @scope.full_name(attr_name),
          message: "must have length #{@option.inspect}"
        }
        raise Grape::Exceptions::Validation, args
      end
    end
  end
end
```

The `@option` is the option passed, in my case `2`. 

```ruby
params do
  optional :coords, type: Array, length: 2
end
```

By using `===` ranges are also supported, so a short bio could be validated as well.

```ruby
params do
  optional :bio, type: String, length: (0..250)
end
```

### Conclusion

Validations at the parameter level do not replace model validations, but are nicely semantic for quickly rejecting bad requests. The main benefit of using parameter validations is also for generating API documentation that hides the internal workings of the app. 
