I've used a number of frameworks and build tools over the last two years. I can't lie: [React](https://facebook.github.io/react/index.html) + [Webpack](http://webpack.github.io/docs/) + [Bacon](http://baconjs.github.io/api.html) is the real deal. Let me show you why.

### The Big Picture

The React docs completely miss the point. React is cool because it makes it easy to think about code, and natural to separate out components. So basically front-end nirvana. 

To summarize the docs your application is a component. Each page is a component. The menu is a component, and each menu item is ... can you guess ... a component! Everything is a component. Simple. A component is one encapsulated logical unit. It keeps track of *state*, renders itself with a pure function, and cleans up after itself with *lifecycle* hooks. 

The key mental shift is never *change (v)* the DOM. Instead set component state and trust that the render function will update the DOM to reflect it was *changed (adj)*. What does this look like?

```
onClick={ function } -> setState({ hidden: true })
render -> state.hidden? -> element
```

You get to separate logic and display. *When the user clicks the button, what fact changes?* The menu should be hidden. *Ok, now given the menu should be hidden, how can the view reflect that fact?* No menu element in output. 

Read more about React: https://facebook.github.io/react/index.html

### Build System

Why walk when you can fly? Webpack is pretty flawless when it comes to parsing and transforming files. Here's an example project structure.

```sh
project
├── README.md
├── app
│   └── index.js
├── dist
├── public
│   └── index.html
├── node_modules
├── webpack.config.js
└── package.json
```

Install webpack and the clean plugin to remove old files.

```sh
$ npm install --save-dev webpack clean-webpack-plugin
```

Webpack config file.

```js
// webpack.config.js

module.exports = {
  
  // The main app file
  
  entry: [
    __dirname + '/app/index.js',
  ],
  
  // Where should the bundle go?
  
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },
  
  // Where are the modules? For npm its node_modules
  
  resolve: {
    modulesDirectories: [ 'node_modules' ],
  },
  
  // If you want ES6 / ES7 syntax sugar and modern web APIs
  
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
  
  // We don't want old unused files lying around
  
  plugins: [
    new (require('clean-webpack-plugin'))([ 'dist' ]),
  ],
}
```

Webpack works with loaders. You can register them based on file extension in the `module` part of the config (like we did for all `.js` files and `babel-loader`) or prefix require statements.

```sh
$ npm install --save-dev babel-loader jsx-loader file-loader
```

When you require react components, use the jsx loader so you can put html-lookin stuff in the render function. 

```js
var Header = require('jsx!./components/header.js)
```

Alright build and watch.

```
$ webpack --watch
```

Read more about Webpack: http://webpack.github.io/docs/

### Hello World

It took me a few minutes to search for how to set this up, so here you go.

```html
<!-- public/index.html -->

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
  </head>
  <body>
    <div id="view"></div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

The main js file requires the others.

```js
// app/index.js

// Copy index.html to dist

require('file?name=index.html!../public/index.html')

var React = require('react')

var ApplicationView = React.createClass({
  render: function () {
    return <p>Hello world</p>
  },
})

React.render(
  <ApplicationView></ApplicationView>,
  document.getElementById('view'),
  function () {
    console.log('application started')
  }
)
```

Ok, a blank canvas. Read on for structure. 

### Event Streams

Application state is not fixed, it depends on time. The best way to model a value changing over time is with an event stream. What does that look like? 

```sh
$ npm install --save baconjs
```

```js
var { Bus } = require('baconjs')

var stream = new Bus()
var defaultValue = 1
var property = stream.asProperty(defaultValue)

property.onValue(function (x) {
  console.log('coffee: ' + x)
})

// logs coffee: 1

stream.push(2)

// logs coffee: 2

property.onValue(function (x) {
  console.log('tea: ' + x)
})

// logs tea: 2


stream.push(3)

// logs coffee: 3
// logs tea: 3
```

You push values to an *event stream* and listen for new values. Value and time. Nice. 

Read more about Bacon: http://baconjs.github.io/api.html

### Streams Are Tight

For example, let's model the current page as an event stream. Values could be `'HOME'` or `'SIGN_IN'`. I usually put application data streams into the `app/stores` folder, but you're an elite coder so do your thing. 

```js
// stores/views.js

var viewStream = new Bus()
var currentView = viewStream.asProperty()

exports.navigate = function (view) {
  return viewStream.push(view)
}

exports.eventStream = function () {
  return currentView.skipDuplicates()
}
```

Anywhere in the application you can listen for view changes or cause them.

```js
var views = require('./stores/views')

// check auth

if (!user) {
  views.navigate('SIGN_IN')
}

// watch for page change

views.eventStream().onValue(function (view) {
  console.log('current view is', view)
})
```

The nice part about an event stream is that it doesn't care where changes come from. For example let's start with the last view from local storage. 

```
var lastPage = localStorage.getItem('lastPage')
viewStream.push(lastPage)

exports.navigate = function (view) {
  localStorage.setItem('lastPage', view)
  return viewStream.push(view)
}
```

That's it. How about a full router. 

```
var page = require('page')

page('/', function () {
  viewStream.push('HOME')
})

page('/login', function () {
  viewStream.push('SIGN_IN')
})

page()
```

Done. Streams make things easy. 

### Render With State

We have values that change over time, now to render stuff. The basic lifecycle is as follows.

* `componentDidMount`: start listening for new values
* client and server events push new values to the stream causing renders
* `componentWillUnmount`: stop listening and clean up

To keep things DRY use a mixin to bind reactive properties (streams) to application state.

```js
var KEY = '_baconUnsubscribeFunctions'

var BaconMixin = {
  componentWillMount: function () {
    this[KEY] = []
  },
  
  componentWillUnmount: function () {
    this[KEY].forEach(f => f())
  },
  
  bindStreamValue: function (name, stream) {
    var self = this
    var off = stream.onValue(function (value) {
      self.setState({ [name]: value })
    })
    this[KEY].push(off)
  },
}
```

So much boilerplate, right? Oh calm down, we're here now. 

```js
var Component = React.createClass({
  mixins: [ BaconMixin ],
  
  componentDidMount: function () {
    this.bindStreamValue('view', views.eventStream())
  },
  
  render: function () {
    switch (this.state.view) {
    case 'HOME':
      return <Home></Home>
    case 'SIGN_IN':
      return <SignIn></SignIn>
    default:
      return <NotFound></NotFound>
    }
  },
})
```

All you have to do to change and re-render the entire application is push a new value to the views event stream. Hopefully you see the ease in event streams, pure render functions, and components. 

I don't really do comments, tweet [@aj0strow](https://twitter.com/aj0strow). 
