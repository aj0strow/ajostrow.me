It's pretty common to have a string slug used on the client for vanity urls. Sometimes it's useful to organize lists by that natural key so the user can find records visually. 

For a recent project I wanted records organized by building name and room number, which was represented in the string slug as name-###. 

Backbone collections will maintain order when a comparator is defined. A naive implementation would be to simply compare based on the slug.

```javascript
Backbone.Collection.extend({
   comparator: 'slug'
});
```

This will cause building-11 to come before building-9 as string comparison does not take into account the actual value. Instead, array comparison should be done with the different parts converted to respective types.

```javascript
   comparator: function(model) {
      var slug = model.get('slug').split('-');
      return [ slug[0], +slug[1] ]; 
   }
```

A general solution for number comparison support would be:

```javascript
function(model) {
   return _.map(model.get('slug').split(/\W+/), function(part) {
      return isNaN(part) ? part : +part;
   });
}
```

To make it asc / desc change +part to -part. 