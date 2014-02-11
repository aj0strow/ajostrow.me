Twitter seems to open source every facet of their applications. I'm building a rails app on top of twitter and it couldn't be quicker. 

One issue though is that embedded tweets come with cards, and the data-cards attribute is ignored. I tweeted @twitterapi but haven't heard anything back. Luckily it's pretty straight-forward to parse raw tweet text on the client.

### Rendering Tweets

To render tweets, a simple solution is to pass the tweet as json, and let the client render it nicely. Hogan assets will allow mustache templates to be used in the asset pipeline

```ruby
# Gemfile

gem 'hogan_assets'
```

```ruby
# config/initializers/hogan_assets.rb

if defined?(HoganAssets)
  HoganAssets::Config.configure do |config|
    config.template_namespace = 'JST'
    config.template_extensions = %w(mustache stache)
  end
end
```

The tweet itself may involve anything, but here's a simple one that wraps the tweet content. 

```html
<!-- app/assets/javascripts/tweet.js.stache -->

<div class="tweet">
  {{{ tweet.markup }}}
</div>
```

Twitter has open-sourced the package (although 900 LoC) to parse out entities from tweets with [twitter/twitter-text-js](https://github.com/twitter/twitter-text-js). Rendering it comes down to using twitter's library and rendering the precompiled template. 

```javascript
// app/assets/javascripts/render.js
//
//= require twitter-text
//= require tweet

function render(tweet) {
  var template = JST['tweet'];
  tweet.markup = twttr.txt.autoLink(tweet.text);
  return template.render({ tweet: tweet });
}
```

### Problems & Solutions

First off, if you mention someone the link looks terrible because the @ symbol is not included in the link. For example:

```javascript
var tweet = { text: '@aj0strow who honestly cares? use oembed' };
render(tweet)

// <div class="tweet">@<a ...>aj0strow</a> who honestly cares? use oembed</div>
```

Which looks terrible like this @[aj0strow](https://twitter.com/aj0strow) but more pronounced. 

Another problem is that the links click-through. I wanted it to open links in a new tab so users wouldn't need to figure out how to get back to the app page. 

It's a bit hacky using regular expressions with markup, but I wasn't sure what the selection was for the letter before a specific tag. So a regexp it was. Normally don't do this. 

```javascript
function render(tweet) {
  var template = JST['tweet'], html, $tweet;
  tweet.markup = twttr.txt.autoLink(tweet.text);
  html = template.render({ tweet: tweet });
  
  html = html.replace(/@<a/g, '<a');
  $tweet = $(html);
  $tweet.find('a').prop('target', '_blank');
  $tweet.find('a[data-screen-name]').each(function() {
    this.innerHTML = "@" + this.innerHTML;
  });
  return $tweet;
}
```

Not particularly elegant, but at least the links come out properly and open in a new tab!