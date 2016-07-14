I finally found a testing setup that's productive, so I thought I'd share it. I'm assuming you already use React and maybe haven't written any tests, or you have and it's a clunky setup.

### Jest Config

I chose to use [jest](https://facebook.github.io/jest/) for ongoing maintenance from Facebook and superior experience. Here is how I configured the test runner.

```js
// package.json

  "jest": {
    "automock": false,
    "moduleFileExtensions": [
      "js",
      "json"
    ],
    "moduleDirectories": [
      "node_modules",
      "src"
    ],
    "moduleNameMapper": {
      "^.+\\.s?css$": "<rootDir>/src/modules/style-mock.js",
      "^.+\\.(png|jpg|gif|ttf|eot|svg)$": "<rootDir>/src/modules/file-mock.js"
    },
    "testPathDirs": [
      "<rootDir>/src"
    ],
    "testRegex": "-test\\.js$"
  }
```

The `moduleDirectories` and `moduleFileExtensions` options should correspond to your webpack resolve config.

```js
// webpack.config.js

  resolve: {
    root: [
      path.join(__dirname, "src"),
    ],
    extensions: [ "", ".js" ],
  }
```

The `moduleNameMapper` is used to stub non-javascript imports. I use CSS modules so the style mock is an empty object.

```js
// src/modules/style-mock.js

export default {}
```

The file mock is for stubbing asset imports so I used an empty URL.

```js
// src/modules/file-mock.js

export default ""
```

Finally the `testPathDirs` and `testRegex` determines how to find test files. I chose to suffix test files with `-test.js` and keep tests in the same folder as components. 

### Run vs Watch

There's two ways to run Jest. You can run all tests.

```sh
$ jest
```

You can also only run changed tests on each save. It seems to sync with git to figure out what's new, but that's conjecture. 

```sh
$ jest --watch
```

I personally run watch mode locally, and run all the tests on the build server, which gets triggered on each merge or push to the master branch on github. You rarely need to run the entire test suite while building. 

### Enzyme Shallow

The React test utils are clunky compared to **[airbnb/enzyme](https://github.com/airbnb/enzyme)**. I grew up with jQuery so it's intutive and powerful. The docs are fantastic, and it was designed to move fast.

```js
// component-test.js

import React from "react"
import { shallow } from "enzyme"

import Component from "./component"

it("should render component", () => {
  let context = { router: {} }
  let elem = shallow(<Component />, { context })
  
  // Access properties
  
  elem.find("button").prop("disabled")
  
  // Simulate events
  
  elem.find("input").simulate("change", {
    target: {
      value: "Hello World"
    }
  })
  
  // Access state
  elem.state("message")
  
  // Fuzzy match children, example: <p class="whatever">Hello World</p>
  elem.containsMatchingElement(<p>Hello World</p>)
})
```

### Chai Assert

One issue with Jasmine is the popularity of expectation syntax. I don't like it.

```js
expect(object).to.not.makeSense()
```

Instead use the [chai assert library](http://chaijs.com/api/assert/).

```js
import { assert } from "chai"

assert(!object.makeSense())
```

The benefit is nice error messages when you use specific assertions.

```js
assert.lengthOf(collection, 3)

// Error: length was 2, not 3
```

### Sinon Stubs

I found it too complicated to mock everything. If you look above in the Jest config, I turned off `automock`. Instead use [sinon](http://sinonjs.org/) for mocks and stubs when needed. I usually pass side-effect functions as actions into the component properties.



Instead of mocking everything, you'll pass actions into components, and use sinon spy's to verify that the correct function properties are called.

```js
import sinon from "sinon"

it("should logout on click", () => {
  let logout = sinon.spy()
  let elem = shallow(<Header logout={logout} />)
  elem.find("button:contains('Sign Out')").simulate("click")
  assert(logout.called)
})
```

You can also stub async redux actions with a promise.

```js
class ServerError extends Error {
  constructor (message) {
    super(message)
    this.status = 500
  }
}

it("should show red dot on server error", () => {
  let err = new ServerError()
  let heartPhoto = sinon.stub().returns(Promise.reject(err))
  let elem = shallow(<Photo heart={heartPhoto} />)
  elem.simulate("doubleClick")
  
  // check for red dot
})
```

With this setup, I can write unit tests for a mid-size app in 1-2 days. 

Tweet if you know a better way [@aj0strow](https://twitter.com/aj0strow). 
