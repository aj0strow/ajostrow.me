After looking into client-side apps, I haven't found many tutorials on proper templating, with most insight limited to "go check out handlebars." I kind of like the Underscore templating system, and as it is already a dependency of many frameworks so there's no overhead to loading another library. 

Start with defining each template as a template with a script tag. Technically it could be any tag that is not shown by the browser, but a script element is a good choice because if the browser doesn't recognize the language used, it will not attempt to run the code. And of course script elements are invisible. 

```html
<script type="text/template" class="template" name="user-li">
  <li><%= user.name %> - <%= user.score %></li>
</script>
```

You could use id="user-li" instead of name="user-li", but IDs are precious and it probably makes more sense not to have a potentially conflicting name with another element in the page. The templates' presence ideally shouldn't be noticed. 

Once all of the templates are defined, use jQuery to grab each script with the template class, and Underscore to compile each template's markup into a templating function.

```javascript
var templates = {};
$('script.template').each(function() {
  var $this = $(this);
  templates[$this.attr('name')] = _.template($this.html());
});
```

The templating can further be simplified syntax-wise if it's wrapped in a rendering function.

```javascript
var app = {};
app.templates = templates;
app.render = function(template, data) {
  return this.templates[template](data);
}

var john = { name: 'John', score: 147 };
app.render('user-li', { user: john });
```

This is a pretty simple example, but thats the point! Client-side templating is simple, and you can get a nice rendering function without much hassle. More work could probably be done to ease the pain of always having to give the root name of the object, or easily rendering templates within other templates, but the basics are there. 