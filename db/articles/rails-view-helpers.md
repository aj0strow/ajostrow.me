Too often repetitive markup is necessary to display things correctly. For example, if you use horizontal forms from the [twitter bootstrap framework](http://twitter.github.com/bootstrap/), here is the markup for typical email and password inputs:

```html
<div class="control-group">
    <label class="control-label" for="inputEmail">Email</label>
    <div class="controls">
        <input type="text" id="inputEmail" placeholder="Email">
    </div>
</div>
<div class="control-group">
    <label class="control-label" for="inputPassword">Password</label>
    <div class="controls">
        <input type="password" id="inputPassword" placeholder="Password">
    </div>
</div>
```

Wouldn't it be a lot nicer to call some method from the view to generate that instead of writing it each time?

```erb
<!-- Something like the following -->
<%=  bootstrap_input :email %>
<%=  bootstrap_input :password %>
```

If your answer is "Yes, it would!", then read on...

### Setup

All helper methods used in views should be defined in the helpers directory of the app. So create a new helper and call it something meaningful. 

```ruby
# app/helpers/form_helper.rb

module FormHelper

end
```

And make sure to declare it as a helper in your controller as well. If you'll need it in many controllers, it's fine to add it in the application controller.

```ruby
# app/controllers/application_controller.rb
...

  helper FormHelper

...
```

### Ruby basics used below

Skip this if you're good at ruby coding. 

There are some useful things to do when writing methods. One of them is setting a variable if one is not defined. This is useful for setting default values in options hashes.

```ruby
hash = {}
hash[:pizza]
# => nil

hash[:pizza] ||= "Cheese"
hash[:pizza] 
# => "Cheese"

hash[:pizza] ||= "Pepparoni"
hash[:pizza]
# => "Cheese"
```

Another basic concept is symbol-to-proc, which basically allows you to pass in a symbol instead of a block to methods that take a block, and it will apply the method the symbol represents instead. 

```ruby
[1, 2, 3].reduce &:+
# => 6

# instead of
[1, 2, 3].reduce{ |sum, val| sum += val }
# => 6
```

The last helpful method (added by Rails) is Hash#slice. Basically it gets a subset of a hash based on keys.

```ruby
hash = {a: 1, b: 2, c: 3}
hash.slice :a, :b
# => {a: 1, b: 2}
```

### Notes on Rails helpers

Rails comes with a number of helpers to help you make markup abstractions. For instance, link_to creates anchor tags. The kind of end-all-be-all helper is content_tag. 

Helpers generally accept a value or a block and an options hash. It would be wise to emulate that approach. Remember, to pass a block right down through the function, pass the block itself. For example wrapping something in a 'wrapper' div:

```ruby
def div_with_wrapper(options={}, &block)
  content_tag :div, class: 'wrapper', do
    content_tag :div, options, &block
  end
end
```

And using it

```erb
<%=  div_with_wrapper, class: 'inner' do %>
  <p>Normal markup can go in here!</p>
<% end %>
```

If you want to put multiple tags inside another one, then you need to concatenate them. Note also that you cannot use Array#join or the markup will be escaped.

```ruby
def my_helper
  list = ['apple', 'orange', 'pear']
  content_tag :ul do
    list.map{ |fruit| content_tag :li, fruit }.reduce &:+
  end
end

def another_helper
  first = content_tag :p, "First"
  content_tag :div, first + content_tag(:p, "Second")
end
```

Also, if you want to use raw text instead of helpers (not necessarily encouraged), then know about heredocs which allow multiple-line text with string interpolation, and the html_safe method that turns your string (not trusted by rails views and therefore encoded) into an ActiveSupport::SafeBuffer which will be rendered as html. 

```ruby
def span_with_value(value)
  markup = <<HTML
    <span>
        #{value}
    </span>
HTML
  markup.html_safe
end
```

Final note: if you want to see the actual markup as text in your view (for debugging), the normal html_escape (aka 'h') method will not work, and calling to_s on the ActiveSupport::SafeBuffer just returns itself. Instead, concatenate to an empty string.

```erb
<%= "" + my_helper_method %>
```

### Writing a helper method

Now it's time to write the convenient bootstrap form method in FormHelper.

```ruby
module FormHelper

  def bootstrap_input(field, options={})
    options[:id] ||= "input#{field.to_s.camelize}"
    options[:label] ||= field.to_s.titleize
    options[:type] ||= inferred_type_of field
    options[:placeholder] ||= options[:label]
    
    controls = content_tag :div, class: 'controls' do
      tag :input, options.slice(:type, :id, :placeholder)
    end
    content_tag :div, class: 'control-group' do
      content_tag(:label, options[:label], class: 'control-label', 
            for: options[:id]) + controls
    end
  end
  
  private
  
    def inferred_type_of(field)
      if field == :password
        'password'
      else
        'text'
      end
    end

end
```

And when we call the following in the view:

```erb
<%=  bootstrap_input :email %>
<%=  bootstrap_input :password %>
```

We get:

```html
<div class="control-group">
    <label class="control-label" for="inputEmail">Email</label>
    <div class="controls">
        <input id="inputEmail" placeholder="Email" type="text" />
    </div>
</div>
<div class="control-group">
    <label class="control-label" for="inputPassword">Password</label>
    <div class="controls">
        <input id="inputPassword" placeholder="Password" type="password" />
    </div>
</div> 
```

### Conclusion

Why is this better than just markup? Well for one thing it is more abstraction and less writing code which makes programming more fun and code more readable. Just look at the code above. Would you rather write an interesting function and call it twice or slog through the markup? 

More importantly, if you want to change something, it's easy to find. Suppose we want to make sure all of our 'bootstrap inputs' have the type "email" instead of "text" when they are an email field? We simply change the code in one place:

```ruby
def inferred_type_of(field)
  if [:email, :password].include? field
    field.to_s
  else
    'text'
  end
end
```

On a final note, don't overuse helpers. They are great for cleaning up *very structured and repetitive* markup, but if you find yourself passing in tons of arguments and writing lots of conditionals, it may be time to nest helpers, pass in blocks of markup, or just use static markup. 

For example if I needed 10 if statements in inferred_type_of, it might be better just to pass in :type in the options hash. If even worse I decide I want to change the width, color, and wrap half of the inputs in an absolutely positioned div, using a helper may only complicate things. 