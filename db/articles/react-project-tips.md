
I've been meaning to share productive tips for React. It's daunting to establish project conventions, and lots of patterns are actually anti-patterns that break down as an app grows. These are opinionated choices based on my experience building 3 react websites and cleaning up 1 app written by a contractor this past year. 

### CSS Modules

The default behavior of the css loader is to pull everything into the global css namespace. The problem is style colliding rules. You need to come up with a unique name for every element in every component. 

It's no problem you say, I'll use nested SASS selectors.

```scss
.MyApp--Component {
  button {
    background: red;
  }
}
```

It works! Sweet. Except when you optionally render a child component, which has a button too, suddenly that button is red. The nested style leaked into child components. 

```html
<div className="MyApp--Component">
  <button>I'm red.</button>
  <ChildComponent>
    <!-- expanded to show content -->
    <button>I'm also red, but shouldn't be.</button>
  </ChildComponent>
</div>
```

It's no problem you say, I just need to be more specific. 

```scss
.MyApp--Component--button {
  background: red;
}
```

Sweet, you did it! The component style is self-contained. A little publicised feature of the [**webpack/css-loader**](https://github.com/webpack/css-loader) is [locally scoped modules](https://github.com/css-modules/css-modules) which means instead of relying on global class name, you assign the class directly.

```scss
// bad: ugly namespace, leaks

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

I know about inline styles like [**FormidableLabs/radium**](https://github.com/FormidableLabs/radium) but I find it's hard to write, looks terrible, and is missing essential features like media selectors or animation keyframes. 

In reality, you probably want a mix of global styles for buttons and forms, and local styles for borders, layout, and spacing. The inconvenience of moving styles when refactoring components is nothing compared to the benefit of clean selector names and no style leaks. 

### Components Are Folders

When you have at least a `.jsx` and `.scss` file per component, you need to group the files together in a folder instead of using one `.jsx` file per component. 

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
  /SearchBar
```

If you want to add a search bar, add a new folder `/SearchBar` and your top-level component hides the complexity within `/Header`. Component folders *scale*. 

### Connect Redux In Index

With redux apps, you need to connect data and expose actions. Consider the component folder tip from earlier in the article.

```sh
/MyComponent
  MyComponent.jsx
  index.js
```

Keep the component file pure and connect redux in the index file. This way you can unit test the component file with stubs, and you can see what data and actions a component hierarchy needs by looking at the index file. 

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

When you bind action creators, I would avoid `import * as actions` and instead import actions one at a time. The benefit is documentation in the future. 

### Avoid Linked State Mixin

I clung onto this for a while, mostly because everyone online told me not to but couldn't provide a reason *why*. It turns out they were right, and the reason is empirical. Try it both ways the component hierarchy without linked state is better. 

*Fin*

That's it folks. If you have tips of your own, tweet [@aj0strow](https://twitter.com/aj0strow). 
