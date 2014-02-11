I was inspired by the [xkcd substitutions commic](http://xkcd.com/1288/) below to write a simple web server that and mirrors a news site with the substitutions. 

![xkcd comic](http://imgs.xkcd.com/comics/substitutions.png)

However, I ran into a bit of a problem. News sites have varying styles of capitalization. A naive solution is just to globally replace with case insensitive matches. 

### Global Case-Insensitive

The "g" modifier signifies that a regular expression is global, and the (i) modifier makes it case insensitive.

```
replacements = {
  'new study': 'tumblr post'
  # ...
}

substitute = (text) ->
  for phrase, replacement of replacements
    regex = new RegExp(phrase.replace(/\ /g, '\\ '), 'gi')
    text = text.replace regex, replacement
  text
```

If the replaced text was in a title, it comes out awfully:

```
substitute 'New Study On Teen Health'
# => 'tumblr post On Teen Health'
```

### Case Sensitive Replacement

Here's a quick (read: inefficient) solution to get my silly news mirror up and running. 

```
Case = do ->
  @cases = ['upcase', 'downcase', 'titlecase', 'sentencecase' ]
  
  @upcase = (s) -> 
    s.toUpperCase()
    
  @downcase = (s) -> 
    s.toLowerCase()
  
  @capitalcase = (s) ->
    @upcase(s[0]) + @downcase(s[1..])
  
  @sentencecase = (s) ->
    s.split(/\.\s+/).map(@capitalcase).join('. ')
  
  @titlecase = (s) ->
    s.split(' ').map(@capitalcase).join(' ')
  
  @cases.forEach (type) =>
    @["is_#{type}"] = (s) ->
      s is @[type](s)

  @case_of = (s) ->
    iterator = (prev, type) ->
      prev or @["is_#{type}"](s) and type
    @cases.reduce(iterator, null)

  @match = (mask, s) ->
    type = @case_of mask
    if type then @[type](s) else s
  
  @sensitive = (s) ->
    (mask) => @match(mask, s)
  
  this
```

I used the design pattern of an immediately called closure to hold onto scope. It allows for grabbing methods by name, which is useful for the meta-programming style way the string is matched against the case mask. 

The case matcher is far from useful in the real world, but it outputs reasonable replacements for silly news!

```
regex = /hello\ world/ig
replacement = Case.sensitive 'greetings planet earth'
for phrase in ['Hello World', 'HELLO WORLD', 'Hello world', 'hello world']
  console.log phrase.replace(regex, replacement)

###
Greetings Planet Earth
GREETINGS PLANET EARTH
Greetings planet earth
greetings planet earth
###
```