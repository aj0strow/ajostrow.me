The problem with the way sass files are compiled and joined in the Rails asset pipeline is that you don't have access to global variables and mixins. The solution is to manually include files as necessary. 

Here's my folder structure in app/assets/stylesheets:

```
application.css
imports.css.scss.erb
framework.css.scss
framework/
   variables.css.scss
   mixins.css.scss
   styles.css.scss
layouts/
   header.css.scss
   footer.css.scss
   menu.css.scss
users/
   profile.css.scss
...
```

The trick is to include things as you need them, in the right order. First, in the application.css manifest file, require the imports.css.scss file. In that file, import everything else you need. 

```css
// application.css

/*
 *= require_self
 *= require imports
 */
```

In the framework file is a good place to import external stylesheets like bootstrap as well. You can decide whether to change default values by importing bootstrap after the variables, or put the bootstrap import in it's own file with the altered variables. 

```css
// framework.css.scss

@import "framework/variables";
@import "bootstrap";
@import "framework/mixins";
@import "framework/styles";
```

Then in imports, import the stylesheets in the right order. Also make sure to include all asset paths as variables before you import stylesheets that depend on them. You can't import a file with embedded ruby so all the erb has to be in imports.css.scss.erb. 

```css
// imports.css.scss.erb

@import "framework";

$backgroundImagePath: "<%= asset_path 'background.jpg' %>";

@import "layouts/*";
@import "users/*";
...
```

This way you can define the variables and mixins once, and use them globally throughout all stylesheets. 