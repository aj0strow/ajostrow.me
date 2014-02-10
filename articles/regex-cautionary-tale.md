In Ruby, you need to add a magic comment to the top of the file to add special characters like µ (mu). The comment tells the interpreter to use UTF-8 encoding instead of ASCII. 

```ruby
# encoding utf-8
```

Who cares? Well, when programming in English, it's easy to forget about the rest of the world, who uses different character encodings. Which makes it easy to make a careless mistake when writing regular expressions that need to be used outside of North America. 

I recently wrote a regular expression where I wanted to match only letters of words. Normally I'd just use the word character class and be done: /\w+/. But for the problem on hand, underscores and digits were no good. Initially I just rolled out my own:

```ruby
REGEX = /[a-zA-Z]+/ 
```

Which is a construct commonly seen in programs. But it can be a huge mistake! For example, "sister" in Danish, "søster" will break it. Instead, I got it working using a named character class with utf-8 support. 

```ruby
REGEX = /[[:alpha:]]+/

"søster".match(REGEX)
# => #<MatchData "søster">
```