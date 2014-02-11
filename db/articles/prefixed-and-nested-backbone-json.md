The backbone model JSON serialization is a bit lacking in functionality, in the sense of no option to prefix the JSON, and no deep serialization. In fact, it just duplicates the attributes object (from the source):

```javascript
  toJSON: function(options) {
    return _.clone(this.attributes);
  },
```

### Prefixing

It may not be a big deal, but I vastly prefer prefixed JSON in views. For example, in templates, the difference is:

```html
<p>{{ person.name }}</p>   vs   <p>{{ name }}</p>
```

That alone wasn't a good enough reason to redo the toJSON method, but more annoyingly, backbone by default does not do deep serialization. 

### Nested Models / Collections

Suppose you have an Article model, with a nested Comments collection. To get the comments to come out  correctly, you would need to do something specific like:

```javascript
Article = Backbone.Model.extend({
  toJSON: function(options) {
    var attrs = _.clone(this.attributes);
    attrs.comments = attrs.comments.toJSON();
    return attrs;
  }
});
```

Not altogether terrible, but I can't imagine a time when you *wouldn't* want nested models and collections serialized. It also sucks to custom make each toJSON method. 

### The Solution

To prefix models, we'll need to specify the name.

```javascript
Article = Backbone.Model.extend({ name: 'article' });
Comment = Backbone.Model.extend({ name: 'comment' });
```

Here is the improved toJSON method:

```javascript
Backbone.Model.prototype.toJSON = function(options) {
  options = options || {};

  // save the prefix option before it is over-ridden
  var prefix = options.prefix;
  
  // copy attributes
  var data = {};
  _.each(this.attributes, function(value, key) {

    // if the object has a toJSON method, use it
    if (value && value.toJSON) {

      // used later to prevent double-prefixing
      if (prefix) { options.prefix = key; }
      value = value.toJSON(options);
    }
    data[key] = value;
  });
  var json;

  // check if a prefix is required, and that the prefix
  // is not already the key to prevent double-prefixing
  if (prefix && prefix != this.name) { 

    // uses passed in name of model prototype
    json = {}; json[this.name] = data; 
  } else { 
    json = data;
  }
  return json;
};
```

To use prefixing, pass in the prefix option. For example in a View:

```javascript
render: function() {
  var templateData = this.model.toJSON({ prefix: true });
  // render template
}
```

Double prefix prevention is necessary for situations when you have a nested model. Say for instance a comment holds onto the User object that wrote it. 

```javascript
{ comment: { user: {} } }   vs   { comment: { user: { user: {} } } }
```
