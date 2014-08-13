A couple months ago I wrote [an article on fixing twitter mentions](http://www.ajostrow.me/articles/fixing-twitter-mentions). As a side note it always amazes me how much my I used to suck. A friend told me improvement is hard to notice in the short term.

### Twitter Text

This shouldn't be an article because Twitter open sources everything. Lets give it a shot.

```sh
$ bower install twitter-text --save
```

And rendering the tweet text as html should be simple enough.

```javascript
// tweet text -> html

function render (text) {
  return twttr.txt.autoLink(text)
}
```

However if you try it out on a url it doesn't work without the protocol. Equally frustrating is that the url is not truncated. 

```javascript
render('Google is http://www.google.com')
// Google is <a href="http://www.google.com" title=...

render('Google is www.google.com')
// 'Google is www.google.com'
```

It also messes up screen name mentions. For example instead of nice clickable mentions we get awkward ones with the @ symbol outside of the anchor tag. 

```html
@<a href="...">screenName</a>
```

### Regular Expressions

My first attempt was to correct with a regex or two. We know twitter text renders the mention with the @ symbol before the anchor tag, so the solution is to move the @ symbol to the other side of the opening tag.

```
@<a .. >  =>  <a .. >@
```

The anchor tag is a capture group and closing braces are escaped as text so its safe to match against a negative character group.

```javascript
html.replace(/@(<a[^>]*>)/g, '$1@')
```

The next step is line breaks which are otherwise stripped out when redered as html.

```javascript
html.replace(/\n/g '<br>')
```

### Extract Entities

Now the real challenge of url autolinking with shortened display text. Building correct regular expressions would be quite the undertaking. Instead after perusing the twitter-text source code it was clear the only reason the urls weren't being linked was due to a default setting.

```javascript
// autoLink(text, options) ~ line 758

    extractEntitiesWithIndices(text, {extractUrlsWithoutProtocol: false});
```

To fix it the autolinking need be done in more steps.

```javascript
function autolink (text) {
  var entities = twttr.txt.extractEntitiesWithIndices(text)
  return twttr.txt.autoLinkEntities(text, entities)
}
```

Not bad but the urls are still potentially enormous. Deeper into the twitter text package seems an opportunity to provide a display url.

```javascript
// linkTextWithEntity(entity, options) ~ line 587

    var displayUrl = entity.display_url;
    var expandedUrl = entity.expanded_url;
```

Sweet. Url entities just need a couple properties added. Remove leading protocol or www subdomain and truncate the path with a horizontal ellipsis.

```javascript
function shorten (url, length) {
  url = url.replace(/^https?:\/\//, '')
  url = url.replace(/^www\./, '')
  if (url.length > length) {
    url = url.slice(0, length) + '\u2026'
  }
  url = twttr.txt.htmlEscape(url)
  return url
}
```

The length parameter must be played with a bit but I went with around 30. The entities still need to be fixed tho. Also a simpler approach to fix mentions is to adjust the first index for each mention entity. 

```javascript
function fixEntity (entity) {
  if (entity.url) {
    entity['expanded_url'] = entity.url
    entity['display_url'] = shorten(entity.url, 30)
  }
  if (entity.screenName) {
    entity.screenName = '@' + entity.screenName
    entity.indices[0] -= 1
  }
  return entity
}
```

### Render Tweets

Finally to render tweets.

```javascript
function autolink (text) {
  text = twttr.txt.htmlEscape(text)
  var entities = twttr.txt.extractEntitiesWithIndices(text)
  entities.forEach(fixEntity)
  text = twttr.txt.autoLinkEntities(text, entities)
  text = text.replace(/\n/g, '<br>')
  return text
}
```

With this basis its not too hard to render image links too.

```javascript
if (entity.url && /(jpe?g|png|gif$)/.test(entity.url)) {
  // we have an image
}
```

All of the css classes and anchor hrefs are customizable as well in the extract entities method with an additional options object.

```
usernameClass: 'tweet-url username'
usernameUrlBase: 'https://twitter.com/'

hashtagClass: 'tweet-url hashtag'
hashtagUrlBase: 'https://twitter.com/#!/search?q=%23'

cashtagClass: 'tweet-url cashtag'
cashtagUrlBase: 'https://twitter.com/#!/search?q=%24'

listClass: 'tweet-url list-slug'
listUrlBase: 'https://twitter.com/'
```

This is cool because it allows reuse of Twitter's code to implement @mentions and #hashtags on your own hot new social site. 

```javascript
twttr.txt.extractEntitiesWithIndices(text, {
  usernameUrlBase: 'https://my-social-website.com/users/',
  hashtagUrlBase: 'https://my-social-website.com/trends/',
})
```

Pretty specific to one of my projects, but hopefully interesting. When in doubt tweet [@aj0strow](https://twitter.com/aj0strow). 
