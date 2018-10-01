In a recent project I wanted to use webpack to write modern javascript in a rails app. I had trouble installing and integrating webpacker so I decided to roll my own light weight webpack integration. It's actually not that hard if you only need to bundle scripts together in chunks. Here are the steps. 

### Install Node & Yarn

I'm using the following bash commands to install node and yarn on production servers. 

```sh
# Install Nodejs and Yarn.
# https://nodejs.org/en/ 
# https://yarnpkg.com/en/
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt update
sudo apt install -y gcc g++ make nodejs
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install --no-install-recommends yarn
```

I also like remove the yarn prefix to save exact versions by default. It's frustrating to have dependencies change in unexpected ways. 

```sh
yarn config set save-prefix ""
```

### Webpack Config

Install the required packages.

```js
// package.json

  "dependencies": {
    "@babel/core": "7.1.2",
    "@babel/plugin-syntax-dynamic-import": "7.0.0",
    "@babel/plugin-transform-runtime": "7.1.0",
    "@babel/preset-env": "7.1.0",
    "@babel/runtime": "7.1.2",
    "babel-loader": "8.0.4",
    "webpack": "4.20.2",
    "webpack-cli": "3.1.2"
  }
```

Here is the full webpack config. 

```js
// webpack.config.js

const path = require('path');

module.exports = {
  entry: "./app/assets/modules/main.js",
  output: {
    path: path.resolve(__dirname, "webpack"),
    filename: "main.bundle.js",
    publicPath: "/assets/",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env'
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-transform-runtime'
            ]
          }
        }
      }
    ]
  }
}
```

I chose to put source code for webpack modules into `app/assets/modules` to keep it separate from `app/assets/javascripts` which is used with sprockets. In the `output` config you can see my entry file is called `main.js`. I added `@babel/plugin-syntax-dynamic-import` to allow code splitting and `@babel/plugin-transform-runtime` to allow async/await syntax. 

It's important to set the public path to `/assets/` if you want code splitting to work with rails asset pipeline. I decided to compile webpack builds into `webpack` folder but it could easily live in `tmp/webpack` too. 

### Rails Integration

Add `webpack` build directory to asset paths.

```rb
# config/initializers/assets.rb

# Webpack bundles
Rails.application.config.assets.paths << Rails.root.join("webpack")
```

Include the webpack output bundle in `application.js`.

```js
// app/assets/javascripts/application.js

//= require main.bundle
```

At this point webpack should be working in development environment.  

### Precompile in Production

Add a rake task to compile webpack in production and enhance the existing task for assets. It's better to compile in development mode because you don't need to minify the code twice (sprockets will do this already). 

```rb
# lib/tasks/webpack.rake

namespace :webpack do
  task :precompile => 'yarn:install' do
    # Important - It has to be in development mode.
    system "yarn run webpack-cli --mode development"

    # Compile chunks in production. It doesn't work in initializer because the folder
    # is empty when initializer is required time so need to configure after compile step.
    Rails.application.config.assets.precompile += Dir.glob(Rails.root.join('webpack/*'))
  end
end

Rake::Task['assets:precompile'].enhance [ 'webpack:precompile' ]
```

At this point webpack should be working in production environment for single output bundles. 

### Code Splitting in Production

I decided to roll my own webpack integration before I knew it would require code splitting and this part was a little tricky to get working. In fairness it took at least 6 hours which is too much for common tooling. In order to allow code splitting webpack needs to fetch scripts at runtime. However if sprockets is compiling assets then it will add a fingerprint hash which webpack doesn't know about. 

It's messy, but to get it working I had to inject the script name mapping from sprockets into the page and then patch the webpack bundle in production to replace `jsonpScriptSrc` with a function to look up script server paths using the injected mapping. 

Here is the code to inject the mapping as a script tag with json mapping data. 

```rb
# app/helpers/assets_helper.rb

module AssetsHelper
  def webpack_jsonp_chunks
    chunks = {}
    unless Rails.application.config.assets.compile
      assets_manifest.files.each do |file, meta|
        if File.extname(file) == ".js"
          chunks[meta['logical_path']] = file
        end
      end
    end
    chunks
  end

  def webpack_jsonp_javascript_tag
    content_tag(:script, webpack_jsonp_chunks.to_json.html_safe, id: "webpack_jsonp_chunks", type: "application/json")
  end
end
```

```erb
<!-- app/views/layouts/application.html.erb -->

  <head>
    <!-- other stuff here -->
    <%= webpack_jsonp_javascript_tag %>
  </head>
```

Here is the code to patch webpack bundle. I chose to save the file as `lib/tasks/webpack_jsonp.diff` to capture the intent of patching the webpack output js file. 

```diff
-/******/ 	// script path function
-/******/ 	function jsonpScriptSrc(chunkId) {
-/******/ 		return __webpack_require__.p + "" + chunkId + ".main.bundle.js"
-/******/ 	}

+/******/  // custom script path function using rails precompiled assets
+/******/  var railsPrecompiledChunks = JSON.parse(document.getElementById("webpack_jsonp_chunks").innerHTML)
+/******/  function jsonpScriptSrc(chunkId) {
+/******/    var logicalPath = chunkId + ".main.bundle.js"
+/******/    if (railsPrecompiledChunks[logicalPath]) {
+/******/      return __webpack_require__.p + "" + railsPrecompiledChunks[logicalPath]
+/******/    } else {
+/******/      return __webpack_require__.p + "" + chunkId + ".main.bundle.js"
+/******/    }
+/******/  }
```

Here is the added code to `lib/tasks/webpack.rake`.

```rb
    # Apply patch to dynamically change jsonpScriptSrc targets.
    add, remove = [], []
    File.foreach(File.expand_path("../webpack_jsonp.diff", __FILE__)) do |line|
      case line[0]
      when "+"
        add << line[1..-1]
      when "-"
        remove << line[1..-1]
      end
    end
    bundle = Rails.root.join("webpack/main.bundle.js")
    IO.write(bundle, IO.read(bundle).sub(remove.join, add.join))
```

In the end you can split modules by async importing and webpack will either load the module from the server in development mode or load the precompiled asset using the mapping in production. 

```js
async function doWork() {
    const bigModule = await import("big-module")
}
```

### Cost vs Benefit

Is it worth it? I don't think so. It's pretty fragile because it depends on webpack bundle output staying consistent across releases. It's very possible this breaks in the future. I added a ticket to replace the custom build system with `webpacker` in the future. 
