I was having trouble getting the jQuery UI autocomplete module to work with other scripts, and wondered how difficult it would be to roll out my own. If you have relatively few entries to check, for instance my project has around 400 entries total, then I think it's fine to load the entries with the page. 

First the search form, nothing fancy:

```html
<form>
    <input id="search" type="text">
    <div id="dropdown"></div>
    <input type="submit" value="Search">
</form>
```

For the dropdown, I wanted values that started with the search query to show up first, and to limit it to 5 total suggestions.

```javascript
var items = [ array of strings ];

function generateViewFor(match) {
    return "<a href=\"#\"><div>" + match + "</div></a>";
}

$('#search').keyup(function () {
    var query = this.value;
    if (query) {
        var begins = [], 
            middles = [];
        $.each(items, function (_, item) {
            var index = item.indexOf(query);
            if (index == 0) {
                begins.push(generateViewFor(item));
            } else if (index > 0) {
                middles.push(generateViewFor(item));
            }
        });
        var suggestions = begins.concat(middles).slice(0, 5);
        $("#dropdown").html(suggestions.join(""));
    } else {
        $("#dropdown").text("");
    }
});
```

Some ways to extend this would be to make each item an object, to allow fancier view generation. Probably necessary for images and proper links in the dropdown.

Also, a better preference system, such as preferring the start of words within the item. For instance the query "wa" would have suggestion "star wars" before "swam".

Optimizations of course could come later as well. This was just supposed to be a simple example of an autocomplete dropdown without relying on jQuery UI. 