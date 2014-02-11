It took me a while to wrap my head around RequireJS and AMD. It took even longer to get anything working -- I have yet to find a simple hello world example.

All code is also available on github: https://github.com/aj0strow/requirejs-helloworld.

### Git

There's numerous resources for git source management, so it won't be covered here.

```
$ git init
$ touch .gitignore
$ echo '# Hello World' > README.md
$ git add .
$ git commit -m 'initial commit'
```

### Bower

[Bower](http://bower.io/) is a client package manager. If you create a sweet library, you should consider releasing it on bower!

Create a bower.json file which will hold onto dependencies. You can use the command line or create the file yourself.

```
$ bower init
```

```javascript
// bower.json

{
  "private": true,
  "name": "helloworld",
  "version": "0.0.0"
}
```

For setting up paths, I like to deal with components in a directory of the same name. To do that, bower can be configured using a bowerrc file.

```javascript
// .bowerrc

{
  "directory": "components"
}
```

Then install dependencies. 

```
$ bower install requirejs --save
```

It should install to components/requirejs. Make sure to add components to gitignore.

```ruby
# .gitignore

/components
```

### Hello World

To define a module, use the "define" function. Dependencies are declared in an array as the first parameter, and a callback is the second. Each parameter of the callback corresponds to the dependency at the same index. 

The hello_world module doesn't have any dependencies, so the array is empty. The main application will depend on the helloworld module. 

Modules are often in the lib or src folder.

```javascript
// lib/helloworld.js

define([], function() {
  return "Hello World!";
});
```

Each requirejs application needs a main script file which uses the requirejs modules. It's usually called RequireMain.js but I think uppercase files and folders are eye sores. 

```javascript
// require-main.js

require(
  [ 'lib/helloworld' ],
  
  function(helloworld) {
    document.write(helloworld);
  }
);
```

Finally to run the javascript application, we need a bare-bones html page. 

```html
<!-- index.html -->

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Hello World</title>
  </head>
  <body>
    <script data-main="require-main.js" src="components/requirejs/require.js"></script>
  </body>
</html>
```

The script tag's source is require.js, which in turn loads require-main.js in an AMD style. Open the page and you should see "Hello World!"
