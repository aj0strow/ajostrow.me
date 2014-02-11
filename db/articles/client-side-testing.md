It took a little bit to figure out how to install and set up client-side application testing. In this example, I'll use my configuration for testing a Backbone extension, with Mocha, Chai, Phantom JS; tests written in CoffeeScript.

### Test Runner

Javascript tests should be run in the same environment the application is made for, which for client scripts means in a web page. Tests are run by including the test files after the dependencies and application scripts, with a little setup code. 

Start with a basic html structure for any page using your script:

```html
<!-- test/runner.html -->

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">    
  </head>
  <body>
    <!-- vendor -->
    <script src="../vendor/underscore-min.js"></script>
    <script src="../vendor/jquery-min.js"></script>
    <script src="../vendor/backbone-min.js"></script>
    
    <!-- your script-->
    <script src="../backbone.extension.js"></script>
</body>
</html>
```

Notice underscore, jquery, backbone (the dependencies) are in the vendor folder. You can put them anywhere, or use CDNs. The runner so far is the minimum page to use the extension. No tests exist yet.

The next step is to get the testing framework up and running.

### Test Framework

We need to use 3rd party libraries to set up the framework. You could do this many ways, copying the framework scripts into the and adding the scripts, using CDNs, etc. I use npm, which is the next section.

```html
<!-- test/runner.html   (before closing body tag) -->

    <!-- test framework -->
    <div id="mocha"></div>
    <script src="/usr/local/lib/node_modules/mocha/mocha.js"></script>
    <script src="/usr/local/lib/node_modules/chai/chai.js"></script>
    <script>
      assert = chai.assert;
      mocha.setup('bdd');
      mocha.globals([ 'jQuery*' ]);
    </script>
```

We load Mocha, and then Chai for assertions as Mocha does not come with an assertion library. Then we create the global variable "assert" to use in tests (yup, no var was intentional.) 

You can specify 'bdd' or 'tdd', for Behavior Driven Development testing or Test Driven Development respectively. That leads to different method names in the test files. Choose whichever style you prefer. 

Adding jQuery to mocha globals is to avoid an error with global namespace pollution. 

You'll notice the /usr/local/lib/node_modules paths in the script tags. That's where npm globally installs the packages, which is my configuration of choice.

### Managing Dependencies

A good way to manage dependencies is through node package manager (npm). The script is meant to be downloaded and included in projects, so all the dependencies are development ones. Here's an example package:

```json
// package.json

{
  "name": "backbone-extension",
  "description": "A backbone.js extension",
  "author": "you!",
  "version": "0.0.1",
  "devDependencies": {
    "chai": "*",
    "mocha": "1.8.x",
    "phantomjs": "*",
    "mocha-phantomjs": "*",
    "coffee-script": "*"
  },
  "engine": "node"
}
```

To install, use the npm command with the global setting:

```
$ npm install -g --dev
```

### Test Helper

If you need some setup code, putting it in a test helper before any of the tests makes sense. For example if you need some test objects, or some fixtures:

```javascript
// test/test_helper.js

(function(B) {

  B.TestView = B.View.extend({
    className: 'test-view'
  });
  
})(Backbone);
```

And include it in the runner:

```html
<!-- test/runner.html -->

    <script src="./test_helper.js"></script>
```

### Writing Tests

I like to write tests in CoffeeScript because it's much terser, and makes the tests easy to read. Here's an example test file, with before and after hooks:

```coffeescript
# test/coffee/extension_test.coffee

describe 'Backbone.View', ->
  describe '#extension_method', ->
    
    beforeEach ->
      @view = new Backbone.TestView
    
    it 'is true', ->
      assert true

    afterEach ->
      @view.remove()
```

Include the javascript versions of the test files in the test runner:

```html
<!-- test/runner.html -->

    <!-- test -->
    <script src="./js/extension_test.js"></script>
    <script src="./js/other_test.js"></script>
```

The last thing to do is actually run the tests. To do that with mocha, you call:

```javascript
mocha.run()
```

We'll put the run method as the callback to the jQuery ready function:

```html
<!-- test/runner.html -->

   <script>$((mochaPhantomJS || mocha).run);</script>
```

### Custom Test Command

With npm, you can also specify your test command, which we will do in 2 steps: compile coffee-script tests, and then run the test suite with phantom-js.

```json
// package.json

  "scripts": {
    "test": "coffee -o test/js -c test/coffee; 
               mocha-phantomjs test/runner.html"
  },
```

You can then run the test suite effortlessly:

```
$ npm test
```

### Folder Structure

The final project folder structure for a single script ends up being mostly test files!

```
+ backbone.extension.js
- vendor
  + underscore.js
  + jquery.js
  + backbone.js
- test
  - js
    + extension_test.js
  - coffee
    + extension_test.coffee
  - test_helper.js
  - runner.html
+ package.json
```