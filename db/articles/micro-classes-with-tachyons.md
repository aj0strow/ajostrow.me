I wrote about CSS Modules in [React Project Tips](https://www.ajostrow.me/articles/react-project-tips) last year. In the dozen or so months since I wrote the article I built [Thinkwire](https://www.thinkwire.com/) using stylesheet modules with local scope. It worked and our business is now ramen profitable. 

Locally scoped stylesheets were an improvment over global classes but there were also drawbacks. React development takes a long time to sketch views and then fiddle with stylesheets until each component meshes with the rest of the site. I didn't have a good mental framework for sharing components throughout the project so [Thinkwire](https://www.thinkwire.com/) required a ton of bespoke work. I also made the mistake of using SASS/SCSS which added compile time and tooling issues due to native extensions. 

I spent some time learning Tachyons over the past two weekends and built a landing page. Let me tell you -- it was magical. I felt the same feeling as when I first discovered React and components. Multiple inheritance usually sucks, but for micro classes it works and cuts down on decision fatigue. 

### [Tachyons](http://tachyons.io/)

I recommend reading the intro and docs on the [official webiste](http://tachyons.io/). The project advertises smaller stylesheets and faster load times but I think the main benefit is reducing decision fatigue. 

Tachyons is great because instead of picking from a continuous scale of possible values you now pick from an ordinal scale. For example say you have a list of items and you need to space them out. Without Tachyons you need to decide padding from `0px` to `100px` and try lots of different values until it looks right. With Tachyons the choices are `pa1` to `pa6` so pick your poison and move on. 

```css
/* without tachyons */

.custom-component-class {
    padding: 22px;
}

/* with tachyons */

/* no custom classes needed */
```

### [CSS Modules](https://github.com/css-modules/css-modules)

You can read more about the ideas behind CSS Modules on the dedicated [GitHub page](https://github.com/css-modules/css-modules). Here is the Webpack rule to turn on modules.

```js
// In: module -> rules

{
    test: /\.css$/,
    use: [
        {
            loader: "css-loader",
            options: {
                modules: true,
            }
        },
    ],
}
```

### Modular Stylesheets

When I was young and opinionated I would structure my project using index files. I thought it was better not to repeat the component name so I could change it more easily. 

```txt
/Component
    /TextInput
        /index.tsx
        /style.css
```

In reality if you need to rename your components frequently you are definitely doing it wrong. It's much better to repeat the component name in both file names instaed of having 15 different `index.jsx` files open in your text editor and not knowing which is which. 

```txt
/Component
    /TextInput.jsx
    /TextInput.css
    /Button.jsx
    /Button.css
```

Your component file is a normal React component.

```js
// Button.jsx

import * as React from "react"
const css = require("./Button.css")

class Button extends React.Component {
    render() {
        return <button className={css.button}>
            {this.props.children}
        </button>
    }
}

export default Button
```

The accompanying stylesheet combines classes from Tachyons. 

```css
.button {
    composes: pa2 br3 bg-white dim from 'tachyons';
}
```

With this approach you get local classes scoped to the component that use global classes to avoid decision making. You get to have your cake and eat it too. 

### Font Book

If you need to use a set of fonts then add a stylesheet `fonts.css` with micro classes per font family. I suggest using the font family name instead of a meaningless label like `headings` or `body`. I would also suggest importing or defining font faces in the stylesheet too.

```css
@font-face {
    font-family: 'Lato';
    font-weight: 400;
    font-style: normal;
    src: url('/fonts/Lato-400/Lato-400.eot');
    src: url('/fonts/Lato-400/Lato-400.eot?#iefix') format('embedded-opentype'),
         url('/fonts/Lato-400/Lato-400.woff2') format('woff2'),
         url('/fonts/Lato-400/Lato-400.woff') format('woff'),
         url('/fonts/Lato-400/Lato-400.ttf') format('truetype'),
         url('/fonts/Lato-400/Lato-400.svg#Lato') format('svg');
}

.lato {
    font-family: 'Lato';
}
```

You can import custom micro classes too.  

```css
.button {
    composes: lato from 'fonts';
}
```

### Color Palette

If your project has a color palette you should add a stylesheet `palette.css` with micro classes. I prefer to use [Name That Color](http://chir.ag/projects/name-that-color/#6195ED) to find an approximate name instead of using a meaningless label like `primary` or `secondary`.

```css
/* palette.css */

.biscay {
    color: #1B3162;
}

.bg-biscay {
    background-color: #1B3162;
}

.b--biscay {
    border-color: #1B3162;
}
```

You can then compose official colors just like micro classes.

```css
.button {
    composes: pa2 br3 white dim from 'tachyons';
    composes: bg-biscay from 'palette';
}
```

If you need gradients add them too.

```css
.bg-lg-biscay-electric-violet {
    background-image: linear-gradient(to right, #1B3162, #8B00FF);
}
```

### Try It Out

Your productivity depends on eliminating choices and reusing prior effort. Components paired with modular stylesheets is a productive combination that speeds up any project. 
