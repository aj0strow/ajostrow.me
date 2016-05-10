
I've been meaning to share some productivity tips for React development. It can be daunting to establish project structure, and lots of patterns simply break down once an app grows into a fully featured product. These are opinionated choices based on my experience building 3 react websites myself and cleaning up 1 app written by a contractor this past year. 

For context: I work with a design studio who provides me Sketch 3 files. I write the stylesheets mostly by copy-paste from sketch and use flexbox for layout. I write the server endpoints to support the features too, but none of my projects have achieved much success yet, so the server side needs only correctness not performance. Most of my time is spent on front end user experience. 

### CSS Modules

The default css loader pulls everything into the global namespace. The issue with this is you need to come up with a unique name for every non-conflicting component style. If you factor your app correctly, each component should be reasonably unique. 

One way to avoid style collision is with unique namespaces and nested selectors using SASS. The issue is you need to come up with unqiue names, and type them each time. 

A little publicised feature of the [**webpack/css-loader**](https://github.com/webpack/css-loader) is [locally scoped modules](https://github.com/css-modules/css-modules) which means instead of relying on global class name, you assign the class name directly.

```scss
// bad: ugly namespace

.MyApp--Component {
  padding: 20px;
  
  .button {
    &:disabled {
      border: none;
    }
  }
}
```

```jsx
import "./style.scss"

<div className="MyApp--Component">
  <button className="button"></button>
</div>
```

```scss
// good: local css module

.component {
  padding: 20px;
}

.button {
  &:disabled {
    border: none;
  }
}
```

```jsx
import css from "./style.scss"

<div className={css.component}>
  <button className={css.button}></button>
</div>
```

I know about inline styles like [**FormidableLabs/radium**](https://github.com/FormidableLabs/radium) but I find it's hard to write, looks like shit, and is always missing essential features like media selectors or animation keyframes. 

The advantages are:

* Less stress coming up with unique names. Module 1 can have a `.button` and Module 2 can also have `.button` and they can mean different things. 
* No chance of collision. Normally classes collide in unpredictable ways which fuck up your design. 

The disadvantages are:

* Breaking components into sub-components requires refactoring stylesheets. I've found this to be a minor inconvenience for the benefits of no collision and easy naming. 
* Forces you to use JS components intead of CSS components. Again, works for me. 

Trust me, once you go modules you will never, ever go back. 

### Components Are Folders

When you have at least a `.jsx` and `.scss` file per component, you need to group the files togehter in a folder instead of using one `.jsx` file per component. 

```sh
/components
  /MyComponent
    MyComponent.jsx
    style.scss
    index.js
```

It's a bit tedious to create an `index.js` file to import and export, but it allows local styles, local unit tests, and sub-components. Consider before:

```sh
/header
  Header.jsx
  DropdownMenu.jsx
  DropdownElement.jsx
/styles
  header.scss
```

And after:

```sh
/Header
  Header.jsx
  index.js
  style.scss
  /DropdownMenu
    DropdownMenu.jsx
    index.js
    style.scss
    DropdownElement.jsx
```

If you want to add a search bar, add a new folder `/SearchBar` and your top-level folder structure hides all the complexity within `/Header`. Component folders *scale*. 

### Use Namespaces For Redux

My first inclination with [**reactjs/redux**](https://github.com/reactjs/redux) was to organize it like a local Firebase and store data in logical collections.

```js
{
  users: {
    "$id": { "user": "here" }
  },
  articles: {
    "$slug": { "article": "one" },
    "$slug": { "article": "two" },
  },
}
```

I think this structure is **wrong**. You want to partition by an arbitrary prefix key like `session` and then include all possible state variables to render the view. 

```js
{
  session: {
    user: null,
    token: null,
    
    loading: false,
    
    username_pending: false,
    username_available: false,
    username_taken: false,
    username_error: null,
    
    signup_pending: false,
    signup_error: null,
    
    signin_pending: false,
    signin_error: null,
  },
  
  content: {
    articles: {},
    
    has_requested_ever: false,
    
    refreshing: false,
    
    current_article: null,
    article_pending: false,
  },
}
```

It feels dirty to mix app state with server data, but at the end of the day your component needs both to render successfully. It reminds me how databases don't care about importance of data, like your email address and default profile link color are both treated equally as text columns. 

### Symbol Action Constants

Instead of prefixing redux actions with the namespace, or writing really long globally unique action names, use an [es6 symbol](https://github.com/medikoo/es6-symbol). It's why they exist. 

```js
// bad: long global name

export const AUTH_START_SESSION = "AUTH_START_SESSION"

// bad: namespace included

export const START_SESSION = "auth/START_SESSION"

// good: symbol

export const START_SESSION = Symbol("start session")
```

### Simple Async Suffixes

When you make external api requests, there are always three actions involved: when you make the request, if it returns successfully, or if it errors. 

I like the suffixes `_REQ, _OK, _ERR`. They're short to type, and clear in intention. I've seen a lot of `_REQUEST, _SUCCESS, _FAILURE` in open source. It's a lot of typing, and visually distracts from reading the actual action name. 

```js
// bad: long distracting suffix

export const GET_ARTICLES_REQUEST = Symbol()
export const GET_ARTICLES_SUCCESS = Symbol()
export const GET_ARTICLES_FAILURE = Symbol()

// bad: different ambiguous action names

export const REQUEST_ARTICLES = Symbol()
export const LOAD_ARTICLES = Symbol()
export const ARTICLES_ERROR = Symbol()

// good: short unambiguous suffix

export const GET_ARTICLES_REQ = Symbol()
export const GET_ARTICLES_OK = Symbol()
export const GET_ARTICLES_ERR = Symbol()
```

### Connect Redux In Index

With redux apps, you need to connect your data and expose your actions. Consider the component folder tip from earlier in the article.

```sh
/MyComponent
  MyComponent.jsx
  index.js
```

Keep the component file pure, and bind all the data and actions in the index file. This way you can unit test the component file with stubs, and you can see what data and actions a component hierarchy needs just by looking at the index file.

```jsx
// index.js

import MyComponent from "./MyComponent"
import { connect } from "react-redux"

const mapState = (state) => state.session

import { signin, signup } from "where-i-keep-auth-actions"

export default connect(mapState, { signin, signup })(MyComponent)
```

```jsx
// MyComponent.jsx

import React from "react"

class MyComponent extends React.Component {
  static propTypes = {
    signin: React.PropTypes.func.isRequired,
    signup: React.PropTypes.func.isRequired,
    user: React.PropTypes.instanceOf(User),
  }
}

export default MyComponent
```

When you bind action creators, do not do fancy shit like `import * as actions` just import them one at a time. It's documentation for what actions are available when you need to refactor in two months. 

### Avoid Linked State Mixin

I clung onto this for a while, but it **sucks**. Binding data two-ways is simply lazy. Write out the action types, reduce the events, and pass the actions to the form component. It takes longer in the short-term, but it's better long-term because there's fewer subtle bugs like forms not clearing on submit, etc. 

*Fin*

That's it folks. If you have tips of your own, tweet [@aj0strow](https://twitter.com/aj0strow). 
