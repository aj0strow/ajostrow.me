Technology is moving quickly, and while as of late 2012 drag-and-drop file uploads are the bees knees, at the very least user's expect a customized form and a preview. 

The issue with this of course is that inputs in a form of type file cannot really be styled. Some browsers (ahem firefox) also consider it a security liability to give you access to the whole path through javascript, which makes previewing difficult as well. 

Anyway, you see it everywhere, so it is not *that* challenging, and I'll share my own solution below. 

### The form

Note that the wrapper div is important, because if you put the file upload in the .image-upload div, the click even will bubble and cause infinite recursion!

```html
<form>
   <div>
      <div class="image-upload">
         <img alt="" src="path/to/upload-image-icon.png">
      </div>
      <input id="file-upload" type="file">
   </div>
</form>
```

Don't forget to give it a little styling too. It's important to make the .image-upload div feel like a button so users know to click it. Also, the eye sore of a file input needs to be invisible/offscreen considering that's the point of this approach.

```css
.image-upload {
   cursor: pointer;
}
.image-upload:hover {
   // for example, some glow
   box-shadow: inset 0 0 5px white;
}
input[type=file] {
   position: fixed;
   left: -2000px;
   opacity: 0;
}
```

### The magic

To do this correctly, we need to have clicking the #image-upload div be kind of an alias to clicking the file input, and we need to somehow change the src of the .preview image to the new uploaded image each time a new picture is selected. 

First lets get the click masking working. Notice the statement is general so .image-upload can be used again throughout the site. 

```javascript
jQuery(function() {
   $(".image-upload").click(function() {
      $(this).parent().find("input:file").click();
   });
});
```

Now for the dark magic to get the image. 

```javascript
function enablePreviewInside(parentClass, onChangeCallback) {
   $(parentClass).parent().find('input:file').change(function() {
      var img = $(this).parent().find('img');
      var path = this.value;
      img.attr("alt", path);

      if (this.files && this.files[0]) {
         var reader = new FileReader();
         reader.onload = function(element) {
            img.attr("src", element.target.result);
         }
         reader.readAsDataURL( this.files[0] );
      } else {
         img.attr("src",  path);
      }
      if(onChangeCallback) onChangeCallback();
   });
}

jQuery(function() {
   enablePreviewInside('.image-upload');
});
```

This is clearly a simple example, but the point is that making custom, user-friendly upload forms does *not* require flash, and can be pretty light-weight.