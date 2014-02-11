I recently had a little snafu with a button link. I was using an anchor around a button  to replace a form submission if the user wasn't registered. 

```erb
<% if user_signed_in? %>
  <input type="submit" value="Do Action">
<% else %>
  <a href="/sign_up">
    <button>Sign Up to Do Action</button>
  </a>
<% end %>
```

The problem was that when I clicked it, it made a random POST request to the current path. Wut?? Turns out the problem was that HTML buttons have types. You'd be wise to follow the specification.

### Button Types

There are 3 types of buttons [according to the W3C spec](http://dev.w3.org/html5/markup/button.html). The "submit", "reset", and "button" buttons. 

- the "submit" button is just like input[type="submit"], and submits the form when clicked
- the "reset" button resets the form when its clicked (I'll be surprised to ever see it...)
- the "button" button is simply a button to be clicked like a link

```html
<form>
  <button type="submit">Submit Form</button>
  <button type="reset">Reset this Form</button>
</form>

<a href="/important/stuff">
  <button type="button">Important Stuff</button>
</a>
``` 

Long story short, make sure to specify type="button" when you want a plain old button link. 