In single page apps, clicking links should not navigate the user away from the current page. All anchor clicks should be caught and dealt with accordingly. 

### Event Delegation

Shorthand jQuery event binding methods, like `$.click`, miss out on the extremely powerful concept of event delegation. Instead of binding handlers to an array of child nodes, a single handler may be bound to a parent node. Events bubble up the DOM and the parent handler delegates the triggered event to the child. 

Imagine you want to watch the fields in a form to save to the server when they change. A naive approach would be to bind a hander to every input field. 

```javascript
$('#form input').blur(handler);
```

The above code finds every child input of the form, and interates through binding the hander to each input's blur event. A good rule of thumb is to avoid spaces in jQuery selectors. 

Finding and iterating is fast but still takes *some* time. More importantly for single page apps, if new fields are dynamically added to the form, they will not work like the other inputs because they werent in the DOM when the event bindings were passed out. 

A better solution is to use event delegation, binding the blur event to the parent form. 

```javascript
$('#form').on('blur', 'input', handler);
```

Delegation means that the context (aka `this`) in the handler function body refers to the node that triggered the event, even though the event is bound on the parent. 

### Catching Clicks

As the title promised, here's how to catch every click. It triggers backbone routes for local links, and open all external links in a new tab.

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
