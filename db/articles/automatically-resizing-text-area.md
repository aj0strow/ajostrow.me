For whatever reason, browsers do not have an easy way to resize textareas to fit their content. The problem is that it looks terrible to have scrollbars come up, especially for something like small posts or chat boxes.

Luckily, Neil Jenkins figured out a work-around [which he explains in detail](http://www.alistapart.com/articles/expanding-text-areas-made-elegant/). To summarize, put a textarea over an invisible pre inside of a div container. Every time the text in the textarea is changed, copy it into the pre. The textarea is forced to be the exact size of the div, and the div is allowed to grow and shrink with the size of the text in the pre. Clever!

The markup and styling are mostly taken from Neil's article, but I used jQuery and pretended browsers with JavaScript disabled don't exist, which simplifies the styling and scripting needed. Check his original article for graceful degradation and pure css / vanilla js. 

### The Markup

```html
<!-- inside of the form -->

<div class="expanding-textarea">
   <pre><span></span><br></pre>
   <textarea></textarea>
</div>
```

### The Styling

Here's the styling using [Sass](http://sass-lang.com/). I would suggest putting the box-sizing mixin in a main framework .scss file and importing it. 

```css
@mixin box-sizing {
  -webkit-box-sizing: border-box;
     -moz-box-sizing: border-box;
      -ms-box-sizing: border-box;
          box-sizing: border-box;
}

.expanding-textarea {
  position: relative;

  font-size: 1em;
  font-family: arial;
  
  textarea, pre {
    @include box-sizing;
    padding: 5px;

    background: transparent;

    white-space: pre-wrap;
    word-wrap: break-word;
    font-weight: normal;
    font-style: normal;
  }
  textarea {
    position: absolute;
    top: 0; 
    left: 0;
    width: 100%;
    height: 100%;

    resize: none;
    overflow: hidden;
  }
  pre {
    display: block;
    visibility: hidden;

    span {
      width: 100%;
    }
  }
}
```

Note that the font-family, font-size, padding and background are all arbitrary. That's just what I used for best results. 

### The Scripting

The idea is to extend jQuery to allow any container div to be turned into an expanding textarea element. Note the scripting is in [CoffeeScript](http://coffeescript.org/). For javascript, visit the site and it has an in-page compiler. 

```javascript
$.fn.autoExpand = ->
  area = $('textarea', this)
  span = $('span', this)
  area.on 'input', -> span.text area.val()
  area.triggerHandler 'input'

jQuery ->
  $('.expanding-textarea').autoExpand()
```

The key part is the input trigger. Every time the user inputs text (or removes text) from the textarea, the text is copied into the span. This handler is triggered once immediately to display preserved form values. 

And there you have it, auto-expanding textareas!