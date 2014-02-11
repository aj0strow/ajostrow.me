Almost any site needs a list of links somewhere one it. Home | About | Contact | etc

The problem is that it can look like this in the markup:

```erb
<ul>
   <li><%= link_to 'Home', root_path %></li>
   <li><%= link_to 'About', about_path %></li>
   ... etc ...
</ul>
```

Which is repetitive and dull. Instead let's have our markup look like this:

```erb
<ul>
   <% %w[ home about ... ].each do |page| %>
      <%= li_link_to page.capitalize, named_path(page) %>
   <% end %>
</ul>
```

### Named routes

Here are the named routes for the pages:

```ruby
# config/routes.rb

root to: 'pages#home'

%w[ about help contact ].each do |page|
  match page => "pages##{page}", as: page
end
```

### Helpers

To do this, we need the following helpers. They can go anywhere as long as they end up included as helpers in the right controller. 

Interestingly, link_to the helper method we know and love takes any amount of arguments and a block. Also, all of the named routes are methods of the controller. For instance root_path is a method of ApplicationController. 

```ruby
module ApplicationHelper

  def li_link_to(*args, &block)
    content_tag :li do
      link_to *args, &block
    end
  end

  def named_path(name)
    method = "#{name}_path"
    respond_to?(method) ? send(method) : root_path
  end

end
```

It's important to remember to check if the helper for the route exists, because if it doesn't and you send the method to the controller, it will raise an error and crash. I made it default to root_path so the home link would work, but that could easily be '#' the stubbed out url. 

That's it. DRY page navigation links.