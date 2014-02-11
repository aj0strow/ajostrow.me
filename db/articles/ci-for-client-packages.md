Continuous integration is a great tool for maintaining the upstream packages of a project. [Travis CI](https://travis-ci.org/) has the added benefit that when another developer submits a pull request, github will automatically include the build status in the ui. 

Travis CI does not have a built-in way to run client code like [Bower](http://bower.io/) packages. Luckily it's possible to use the nodejs environment and run the client tests through a headless browser. Here are the steps to get that Build Passing image up on a github readme. 

### Bower

Initialize the bower project if you haven't already, and use bower to keep track of dependencies.

```
$ bower init
```

Follow the instructions to get a bower.json file. That goes into source control, but the bower_components do not.

```ruby
# .gitignore

bower_components
node_modules
``` 

Make sure to install and save all dependencies with bower.

```
$ bower install jquery --save
```

### Grunt

The next step is to setup grunt to run the test suite. Make sure the grunt command line interface is installed.

```
$ npm install -g grunt-cli
```

In the gruntfile, specify how to run the test suite. Under the hood it needs to be a command that returns zero on success and a non-zero integer on error. Realistically you should search the npm registry for a grunt package that runs the tests using phantom js. 

Grunt packages are usually prefixed with grunt or grunt-contrib. Good search terms include "grunt", "phantom", "phantomjs", "client" and the framework's name. Follow the directions for the package. 

Note that npm will not install local packages without a package.json or node_modules folder. It's pretty silly to have both a package.json and bower.json, so make the folder.

```
$ mkdir -p node_modules
$ npm install grunt
$ npm install grunt-contrib-jasmine
```

The goal is to run the test suite with grunt, so register the test task.

```javascript
// Gruntfile.js

module.exports = function(grunt) {

   // load the npm tasks (jasmine as an example)
   grunt.loadNpmTasks('grunt-contrib-jasmine');
 
   // configure for the test framework
   grunt.initConfig({
      // config here
   });

   // 'jasmine' is used as an example, but it should be replaced with
   // the task name with the task that runs the test suite
   grunt.registerTask('test', ['jasmine']);
};
```

If you need to reference bower dependencies, the convention is that the script has the same name as the package. You can always go into the bower_components folder and figure out the path too.

```javascript
// example grunt configuration

   options: {
     vendor: [
       'bower_components/jquery/jquery.js', 
     ]
   }
```

Make sure the suite runs and passes.

```
$ grunt test

Testing jasmine specs via phantom
..............................
30 specs in 0.181s.
>> 0 failures

Done, without errors.
```

### Travis CI

Assuming your package is open-source, [Travis CI](https://travis-ci.org/) will run continuous integration for you. Sign in, click on your profile image to see your repos, and toggle travis on.

![Travis CI Instructions](https://fbcdn-sphotos-f-a.akamaihd.net/hphotos-ak-prn1/994975_10152119325922269_1207686802_n.jpg)

Travis depends on a .travis.yml file with the configuration for running the test suite. Here's the configuration from one of my packages:

```yaml
# .travis.yml

language: node_js

node_js:
  - 0.10

before_install:
  - mkdir -p node_modules
  - npm install -g grunt-cli
  - npm install -g bower

install:
  - npm install grunt
  - npm install grunt-contrib-jasmine
  - bower install

script: grunt test --verbose --force
```

### Readme

In the readme, put the status of the latest build for everyone to see. It lets other developers know that you wrote tests and they're passing. Put the image right in the header.

```
# Package Name ![](https://travis-ci.org/name/repo.png?branch=master)
```

Replace "name" and "repo" in the url to the github repository info. (From the repository url github.com/user/repo). 