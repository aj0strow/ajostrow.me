I never used flash messages with Rails, because I hated mixing logic with presentation, in this case setting the message in the controller. I wanted custom content beyond string messages occasionally as well. Basically I wanted to conditionally render a partial.

Some options to pass information are URL parameters, storing data in the session, or a cookie. A one-time message is exactly what flashes are for though, and I think they're the cleanest option.

The idea is to use the flash message as the name of a partial. Then in the layout render the partial if a partial name exists in the flash object. Conditional partial rendering. 

### Define Custom Flash

To avoid confusion with other flash practices, define a new flash type in the Application Controller:

```ruby
# app/controllers/application_controller.rb

  add_flash_types :partial
```

To set the partial name in a controller action, here's an example:

```ruby
# app/controllers/your_controller.rb

def update
  ...
  flash[:partial] = 'credit_card_saved'
end
```

### Render Flash

Wherever you want to render the flash message (probably in a layout or header), add the following:

```erb
<%= render "partials/flash/#{flash[:partial]}" if flash[:partial].present? %>
```

Finally, add flash message partials to the corresponding views directory: 

```erb
<!-- app/views/partials/flash/credit_card_saved.html.erb -->

<div id="credit-card-saved-flash" class="flash-message">
  Thank you! Your credit card is valid and has been saved.
</div>
```

### Testing

I forgot to mention, but testing was a huge factor in this flash message process. I wanted to make sure the right flash message was set in each action, but be able to change what the message actually says without breaking the test suite.

```ruby
# test/functional/your_controller_test.rb

test 'update credit card' do
   ...
   assert_equal 'credit_card_saved', flash[:partial]
end
```