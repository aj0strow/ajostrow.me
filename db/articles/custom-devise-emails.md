Sometimes you don't want the default Devise email messages. Sometimes you want a nice layout, or different messages, or inlined images, or markup helpers for inline styling. If now is one of those times, read on!

### Using Devise

I'm assuming you have devise installed and working. If you haven't yet, see my other tutorial on getting devise set up: http://www.ajostrow.me/thoughts/registering-users-with-email-confirmation

### Custom Views

If you haven't generated custom views yet, we need to! Your new emails should be in "app/views/devise/mailer". 

For default scope emails, run the following command:

```
$ rails generate devise:views
```

For super custom views with multiple scopes, run the command for each scope. For users and admins:

```
$ rails g devise:views users
$ rails g devise:views admins
```

And tell devise you want to use scoped views in the initializer:

```ruby
# config/initializers/devise.rb

  config.scoped_views = true
```

The files will be in "app/views/users/mailer" and "app/views/admins/mailer" respectively. 

### Custom Mailer

Next, subclass the mailer class to add customization.

```ruby
# app/mailers/devise_mailer.rb

class DeviseMailer < Devise::Mailer
  helper EmailHelper
  layout 'email'
  default from: 'no-reply@your-domain.com'
end
```

You'll notice we added a helper, set the layout, and added the default sender. Also, tell devise to use this mailer:

```ruby
# config/initializers/devise.rb

  config.mailer = 'DeviseMailer'
```

### Creating a layout

If you called it "email" like before, then add an email layout! Remember, all styles in emails must be inlined, as there is no opportunity to use an external style sheet. 

```erb
<!-- app/views/layouts/email.html.erb -->

<!DOCTYPE html>
<head>
   <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
</head>
<body>
   <div style="width: 600px; background: #eee;">
      <%= yield %>
   </div>
</body
```

### Inline Images

To use an inline image in your layout or devise email, reference the image like so:

```erb
<%= image_tag attachments['brand.png'].try(:url), alt: 'Brand Name' %>
```

And add the image as an attachment as follows:

```ruby
# app/mailers/devise_mailer.rb

class DeviseMailer < Devise::Mailer
  include AbstractController::Callbacks
  before_filter :add_inline_attachment!

  private 

  def add_inline_attachment!
    image = Rails.root.join('app/assets/images/brand.png')
    attachments.inline['brand.png'] = File.read(image)
  end
end
```

### Email Helper

It's impossible to write emails quickly without a good helper, and having them mostly be embedded ruby (in my experience.) Define your inline styles, and then use the helper to always inline the correct styling and keep emails consistent. 

```ruby
# app/helpers/email_helper.rb

module EmailHelper

  STYLES = {
    h1: 'margin-bottom: 20px; margin-top: 10px; font-size: 32px;',
    h2: 'margin-bottom: 10px; margin-top: 15px; font-size: 18px;',
    h3: 'margin-bottom: 10px; margin-top: 15px; font-size: 14px;',
    a: 'text-decoration: none; color: #32aeee;',
    p: 'margin-bottom: 10px; line-height: 20px;'    
  }

  def email_tag(type, options = {}, &content)
    options[:style] ||= STYLES[type]
    options[:target] = '_blank' if type == :a
    content_tag type, options, &content
  end

end
```

And use the helper like so:

```erb
<%= email_tag(:h3) do %>
   This is an important title! <small>With a subheading</small>
<% end %>

<%= email_tag(:p){ "Really cool paragraph!" } %>
```

Thats all, now you should have highly customized emails!