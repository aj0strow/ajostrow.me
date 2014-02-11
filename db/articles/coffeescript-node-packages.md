Packages are the building blocks of applications, and it's important to structure them in a consistent way. Please note most of this article is my personal preferences, and isn't the only way to write node packages.

### Structure

Simple packages often have one main file in the root directory. This doesn't work as well for coffee-script, so I like to put all source code in src, and compile javascript to lib. Tests are written in BDD form, so they go in the spec directory.

```
- .git
- node_modules
- lib
- src
- spec
+ .gitignore
+ makefile
+ package.json
+ README.md
```

Note that .git and node_modules are created for you by git and npm respectively. 

### Naming A Package

The name of the project should be in lower snake case:

```
very_long_project_name
```

Extensions should be dash delimited from the main project name:

```
main_project-extension_name
```

All of your node packages will need a unique name if you plan on releasing them through npm. You can also install straight from github.

### Source Control

Git is my source control management tool of choice. Here's a sample gitignore:

```
# .gitignore

lib-cov
*.log

logs

npm-debug.log
node_modules
```

Specify the github repository in the package.json:

```js
// package.json

  "repository": {
    "type": "git",
    "url": "https://github.com/username/package_name.git"
  },
  "homepage": "https://github.com/username/package_name",
```

### Make Compile

First off, install coffee-script for compiling:

```
$ npm install coffee-script --save-dev
```

Makefiles are used for task automation. For something complicated it may be worth using Grunt or another task runner with a more familiar syntax. 

```
# makefile

PATH := ./node_modules/.bin:${PATH}

.PHONY : compile clean

all: compile

clean:
	rm -rf lib/*.js

compile: clean
	coffee -o lib/ -c src/
```

Now to compile the project:

```
$ make
```

### Package Main

Npm allows you to specify the main script for when the package as a whole is required. 

```js
// package.json

  "main": "./lib/main",
```

This way javascript applications can require the package too. 

### Testing

CoffeeScript BDD tests have clean syntax, which makes them a great way to test even if the actual package code is written in javascript. Jasmine is a good test framework with coffee-script support, so we'll use it.

```
$ npm install node-jasmine --save-dev
```

NPM has the ability to run the test suite, but we need to add the test script to the package. 

```js
// package.json

  "scripts": {
    "test": "jasmine-node --coffee spec/*_spec.*"
  }
```

To avoid a global installation of jasmine-node, you can substitute:

```
$ node node_modules/jasmine-node/lib/jasmine-node/cli.js 

# same as $ jasmine-node
```

When writing specs (tests), make sure the filename ends with "_spec.coffee" so the test script will recognize it is a jasmine spec.

```coffee
# spec/truth_spec.coffee

describe 'true', ->
  it 'should be true', ->
    expect(true).toEqual(true)

  it 'should be true later', (done) ->      
    setTimeout ->
      expect(true).toEqual(true)
      done()
```

You should get 2 passing tests!

```
$ npm test

2 tests, 2 assertions, 0 failures, 0 skipped
```

### Database Connections

Jasmine doesn't have a built-in way to deal with test-suite-wide initialization and cleanup (for example, connection and disconnecting from a database). Instead we'll require a spec helper at the top of each spec.

```
# spec/spec_helper.coffee

jasmine = require 'jasmine-node'

# open database connection

_finishCallback = jasmine.Runner.prototype.finishCallback

jasmine.Runner.prototype.finishCallback = ->
  _finishCallback.call(this)
  # close database connection
```

```
# spec/truth_spec.coffee

require './spec_helper'
```
