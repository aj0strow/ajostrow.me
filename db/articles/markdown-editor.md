The goal is a text area with markup on the left, and the rendered html on the right. A perfect use case for Angular. 

```
$ npm install -g bower static
$ bower install bootstrap angular showdown
$ static
serving "." at http://127.0.0.1:8080
```

And we're flying. On to the world's littlest editor. 

### Layout

The app will be called `MarkdownEditor`. There's only one view so there need only be one controller. `MainController` is a suitable name. 

```html
<!-- index.html -->

<html ng-app="MarkdownEditor">
<head>
  <link rel="stylesheet" href="bower_components/bootstrap/dist/css/bootstrap.min.css">
</head>
<body ng-controller="MainController">
  <section ng-view>
    <!-- here -->
  </section>
  <script src="bower_components/angular/angular.min.js"></script>
  <script src="bower_components/showdown/compressed/showdown.js"></script>
  <script src="bower_components/showdown/compressed/extensions/github.js"></script>  
  <script src="index.js"></script>
</body>
</html>
```

Go to http://localhost:8080 and you should see a blank page. The console will complain `index.js` can't be found.

### Model & Filter

We need a form for entering markdown text, and a data model to hold onto the text. Angular uses the `ngModel` module for two-way data binding. 

Since the model will be automatically synced, it makes sense to use a filter to convert the markdown to markup. The following goes in the `ng-view` section where it says "here". 

```html
<div class="row">
  <form class="col-md-6">
    <textarea ng-model="text" class="form-control" rows="30"></textarea>
  </form>
  <div class="col-md-6" ng-bind-html="text | markdown"></div>
</div>
```

### Angular App

The textarea model called `text` corresponds to `$scope.text`, initialized to a welcome message. 

```javascript
// index.js

angular.module('MarkdownEditor', [])

.controller('MainController', function ($scope) {
  $scope.text = 'Write *markdown* here...'
})

.filter('markdown', function ($sce) {
  var converter = new Showdown.converter({ extensions: ['github'] })
  return function (markdown) {
    var html = converter.makeHtml(markdown || '')
    return $sce.trustAsHtml(html)
  }
})
```

The `$sce` or [Strict Contextual Escaping](https://docs.angularjs.org/api/ng/service/$sce) service is necessary, otherwise Angular will freak out about rendering raw html into the page. Alright, reload the page. It should be an in-browser markdown editor.

Thoughts, comments? Tweet [@aj0strow](https://twitter.com/aj0strow). 
