When developing singe page apps, anchor clicks should not behave by navigating to a new path.  

### Event Delegation

Shorthand jQuery event binding methods, like `$.click`, miss out on the extremely powerful concept of event delegation. Instead of binding handlers to an array of child nodes, a single handler may be bound to a parent node. Events bubble up the DOM and the parent handler delegates the triggered event to the child. 

Imagine you want to watch the fields in a form to save to the server when they change. A naive approach would be to bind a hander to every input field. 

```javascript
$('#form input').blur(handler);
```

The above code finds every child input of the form, and interates through binding the hander to each input's blur event. Anytime you type a space in a jQuery selector, you probably screwed up. 

First off, finding and iterating is fast but still takes *some* time. More importantly for single page apps, if new fields are dynamically added to the form, they will not work because they didn't exist when event bindings were being passed out. 

Instead, we'll use event delegation, binding the blur event to the parent form. 

```javascript
$('#form').on('blur', 'input', handler);
```

Delegation means that the context or `this` in the handler function body will refer to the node that triggered the event. In other words the two statements are syntactically interchangable. 

### Catching Clicks

As the title promised, here's how to catch every click. I chose to trigger the path with the backbone router, and open all external links in a new tab.

```javascript
$(document).on('click', 'a', function (ev) {
  ev.preventDefault();
  if (this.host == window.location.host) {
    Backbone.history.navigate(this.pathname, true);
  } else {
    this.target = '_blank';
    window.open(this.href);
  }
});
```

To learn more about the anchor tag, check out the [mozilla docs](https://developer.mozilla.org/en/docs/Web/API/HTMLAnchorElement). 
