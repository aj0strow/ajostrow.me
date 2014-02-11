It's not particularly intuitive to make a whole area of components jointly clickable. A use case would be a list with icons and stats that corresponds to one resource. Most StackOverflow answers say you need Javascript. You don't as of HTML 5.

The key is to wrap all of the content in a containing div, and make the div fill a block-level anchor. 

```html
<a class="block-link">
  <div>
    <!-- any content here -->
  </div>
</a>
```

The anchor needs to be a block element, and the wrapper div needs to be inline, otherwise you won't have the whole area clickable. 

```css
.block-link {
  display: block;
  cursor: pointer;
  /* reset text color / underlining */
}

.block-link > div {
  display: inline-block;
  width: 100%;
}
```

The ">" means only children directly contained in the block link. So just the 1 wrapper div will be styled inline. 

Thanks to Zak Kain ([@zakkain](https://twitter.com/zakkain)) for pointing out that in this case a *div* is more semantic than a *section* for the wrapping element. 