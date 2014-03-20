Using sublayouts is necessary to have clean, concise markup. The way to do it is to figure out the most markup that is shared between views, and make it a sublayout. 

Suppose for example you want to surround the pages served with a custom seasonal theming for user profiles.

Here is an example app/views folder structure:

```
layouts/
   application.html.erb
   users.html.erb
   halloween.html.erb
users/
   show.html.erb
   index.html.erb
```

### Using an alternate layout

Before we nest layouts, its important to know how Rails chooses the layout. Rails will first look for the layout chosen in the controller. Remember the action name is available with action_name. 

```ruby
# app/controllers/users_controller.rb

class UsersController < ApplicationController

  layout 'erb_file_name_in_layouts_folder', only: [:show, :index]

  # or use a helper method for more control

  layout :choose_layout

  ...

  private

    def choose_layout
      if ['show', 'index'].include?(action_name) 
        'special_layout'
      elsif action_name == 'edit'
        'weird_layout'
      else
        'normal_layout'
      end
    end

end
```

If the layout is not explicitly declared in the controller, then Rails will look for a layout in the app/views/layouts folder with the name of the controller. In this example, users.html.erb. Otherwise it will finally default to application.html.erb. 

### Using content_for and yield

Another important thing to know is yielding by symbol. Suppose in application.html.erb you provide a place for scripts to be added to the head. 

```erb
<!-- app/views/layouts/application.html.erb -->

...

<head>
  <%= yield :head %>
</head>

...
```

And then in any view, content can be appended inside the head element. For example:

```erb
<!-- app/views/layouts/artists/show.html.erb -->

...

<% content_for :head do %>
  <script type="text/javascript">
    console.log("This is in users#show");
  </script>
<% end %>
```

### Nesting sublayouts

The trick for sublayouts, is that every time you would yield content, instead choose a unique name (the file name works well) and then check if there has been content passed for the given symbol. 

For example: 

```erb
<!-- app/views/layouts/application.html.erb -->

<!-- Where you would normally call yield -->
<%= content_for?(:application) ? yield(:application) : yield %>
```
What this does is check it content has been passed for :application. If there is content, yield that, otherwise yield the view being rendered. Now if you want to do a sublayout just provide content for :application. 

```erb
<!-- app/views/layouts/halloween.html.erb -->

<% content_for :application do %>
  <!-- Fancy images and stuff -->

  <div id="content">
    <%= content_for?(:halloween) ? yield(:halloween) : yield %>
  </div>
<% end %>

<%= render template: 'layouts/application' %>
```

And specify the halloween layout in the controller. Finally, lets select the halloween layout if it is seasonally correct. 

```ruby
# app/helpers/application_helper.rb

module ApplicationHelper
  
  def season_of(date)
    case date
    when Date.new(date.year, 10, 24)..Date.new(date.year, 10, 31)
      :halloween
    end
  end
  
end
```

```ruby
<!-- app/views/layouts/artists.html.erb -->

<% layout = season_of(Date.today) || :application  %>

<% content_for layout do %>
  <div>
    <!-- content -->
    <%= content_for?(:artists) ? yield(:artists) : yield %>
  </div>
<% end %>

<%= render template: "layouts/#{ layout }" %>
```

And that's all. There's no limit to how many layouts you can nest, so keep those views clean. 
