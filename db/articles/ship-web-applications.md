In late 2011 I was 18 years old and had never written JavaScript code. It's been three years, and I've since built a number of web apps. Through trial and error here is my workflow.

Note: if you like to write and maintain your own libraries, deploy servers, monitor and backup database clusters, learn commands like `logrotate`, mess with Docker, or other fun things this article isn't for you. If you want to ship in a month, this might be helpful.

When creating a new product, if possible name the product one word with a capital first letter. Everything's easier that way. Let's make a new web app called `Tutorial`.

### Architecture

All code needs to live in private repositories on [GitHub ($25/m)](https://github.com/pricing). When creating a new product, there are two options. 

1. Create a new GitHub organization for the product, so repositories would look like `tutorial/web` or `tutorial/ios`.
2. Prefix repositories within the parent organization, so repositories would look like `company/tutorial-web` or `company/tutorial-ios`.

The takeaway here is that **products are more than one repository.**

Don't even think about Rails or Django. Traditional MVC frameworks lead to giant applications doing too many things. The goal is to quickly deploy a web application. Having everything in mental scope is taxing and slows down development. 

Static sites are a better user experience anyway, so it's a win-win to decouple the website from the data services. It's also more future proof to start building an API for when it's time to release the API or build native mobile apps. 

A static web app needs routing, template rendering, data binding, and other goodies. Use a framework like [Angular](https://angularjs.org/) or [Ember](http://emberjs.com/). Both have two-way data binding and strong communities. I've found Backbone to be too verbose to ship quickly. 

### Web

The web interface is the first repository.

```sh
$ mkdir -p ~/code/tutorial/web
$ cd -
```

The static site needs to be served off a CDN for speed and with TLS so users feel good about entering credit cards. The best hosting option is [Divshot ($20/m)](https://divshot.com/pricing) which includes routing and injected environment variables. 

```sh
$ divshot init .
name: (web) tutorial
root directory: (web) [enter]
clean urls: (y/n) n
error page: (error.html)
Would you like to create a Divshot.io app from this app?: (y/n) y
```

Choose a build directory. I like `.build` so it doesn't get in the way in alphabetically sorted text editors, but anything works. Then update the `divshot.json` to render the `index.html` regardless of route. The path is preserved so that the JavaScript framework renders correctly.

```javascript
{
  "name": "tutorial",
  "root": "./.build/",
  "clean_urls": false,
  "error_page": "error.html",
  "routes": {
    "/**": "index.html"
  }
}
```

I also keep html files in the templates directory.

```sh
$ mkdir scripts stylesheets templates
$ mv *.html templates
```

Set up a `package.json` for [npm](https://www.npmjs.org/) and a `bower.json` for [Bower](http://bower.io). The `name` and `private` fields are sufficient. All external packages and builds should be excluded from the git repository.

```sh
# .gitignore

node_modules
bower_components
.build
.divshot-cache
```

### Build System

Set up [Gulp](http://gulpjs.com/), a streaming build system. It has a fantastic plugin system, and actually makes sense, unlike Grunt. 

```sh
$ npm install --save gulp
```

Gulp will watch files for changes, run tasks, and put all the files in the the `.build` directory, where Divshot serves them from. 

```javascript
// Gulpfile.js

// dependencies

var gulp = require('gulp')

// paths

var dirs = [ 'templates', 'scripts', 'stylesheets' ]

// tasks

gulp.task('default', [ 'build', 'watch' ])

gulp.task('watch', function () {
  dirs.forEach(function (dir) {
    gulp.watch([ 'Gulpfile.js', dir + '/**' ], [ dir ])
  })
})

gulp.task('build', dirs)

gulp.task('templates', function () {
  return gulp.src('templates/**/*.html').pipe(gulp.dest('.build'))
})

gulp.task('scripts', function () {
  // todo
})

gulp.task('stylesheets', function () {
  // todo
})
```

Open up a terminal window and leave the gulp process running.

```
$ gulp
```

In another terminal window start up the divshot development server.

```
$ divshot server
```

Visit the local site at [localhost:3474](http://localhost:3474).

```
$ open -a 'Google Chrome' --new --args http://localhost:3474 -incognito
```

You should see a welcome message. Try changing the `templates/index.html` file and reload. It should show your change. Look at the Divshot docs for deploying, promoting, and setting environment variables. 

### API

The API is a second git repository. 

```sh
$ mkdir -p ~/code/tutorial/api
$ cd -
```

The simplest hosting option for web servers is [Heroku ($35+/m)](https://www.heroku.com/pricing). Most apps need a database (postgres, mongo), a cache (redis, memchached), monitoring (new relic), and email capabilities (postmark, sendgrid, mailgun). 

All third-party tokens like for Stripe should be kept in environment variables. For local development use a `.env` file and a `dotenv` package for automatically loading it.

Create a staging and a production application. Name them the same thing but with a different suffix. I like `-prod` and `-sand` but anything works. 

```sh
https://tutorial-prod.herokuapp.com
https://tutorial-sand.herokuapp.com
```

**Note: exclusively use the https Heroku endpoints.** Inject the API domain as a Divshot environment variable. I called it `API_ORIGIN` last project. 

The server can be written with any framework or language, but I'd suggest [Grape (Ruby)](http://intridea.github.io/grape/) or [Hapi (Node.js)](http://hapijs.com/). Both are very fast, have parameter validation, flexible routing, and rich ecosystems behind them. You need to enable Cross Origin Resource Sharing otherwise nothing will work. Check out **[cyu/rack-cors](https://github.com/cyu/rack-cors)** or **[troygoode/node-cors](https://github.com/troygoode/node-cors)**.

For authenticating users, you can use the session or a token. Token authentication works with mobile and is dead simple. 

1. Create and index a token string field.
2. User signs in. Generate a UUIDv4 and return to user. Save the token in local storage.
3. On each request check for the token in the Authorization header.
4. User signs out. Remove the token from local storage and the database.

The API should deal with email, webhooks, and respond with JSON to requests from the static website. 

### Workflow

Build features and push constantly. The product will be shipped soon enough. I usually have five open terminal tabs. 

* `api` directory prompt for git workflow and pushing to Heorku
* API web server process
* `web` directory prompt for git workflow and pushhing to Divshot
* Divshot server process
* Gulp process

To build a new feature stub out the route on the server with fake JSON data. Connect to it from the static app and build out the UI. Push it to staging for stakeholders. If they like it, then actually build out the database migrations, model unit tests, route tests, etc. 

That's all. Ship ship ship. 
