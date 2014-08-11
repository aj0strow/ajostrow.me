[Twitter typeahead](https://twitter.github.io/typeahead.js/examples/) has popularized autocomplete inputs, but I find the Bloodhound engine confusing and hard to configure. 

### Query Term Distance

The first step is to provide an api endpoint for query options. Each should have an array of terms and any other information for rendering suggestions.

```javascript
// something like

{
  name: 'Option Name',
  value: 'unique-id',
  terms: [ 'category', 'display', 'name' ],
}
```

Autocomplete suggestions are used to get the desired option in as few keystrokes as possible, so simply matching letters doesn't make sense. Instead by using the [Levenshtein distance](http://en.wikipedia.org/wiki/Levenshtein_distance) limited to the input string length the autocomplete can be extra forgiving. Install **[gf3/Levenshtein](https://github.com/gf3/Levenshtein).**

```sh
$ bower install levenshtein --save
```

To calculate the distance of an array of search terms, take the minimum distance but favor earlier terms.

```javascript
function mindist (query, terms) {
  var dists = terms.map(dist.bind(null, query))
  return Math.min.apply(null, dists)
}

function dist (query, term, index) {
  var start = term.slice(0, query.length)
  var distance = (new Levenshtein(query, start)).distance
  return distance + index * 0.1
}
```

### Autocomplete

Large distances mean that there is very little likelihood the option was intended by the user. However with short queries there's two few letters to adequately limit distance. 

```javascript
distance <= Math.min(query.length - 1, 2)
```

The last thing to do is order and limit the suggestions but with one catch. The levenshtein implementation is iterative which means nothing is being momoized. Sorting by distance would mean n * log(n) distance calculations. Instead use a [Schwartzian transform](http://en.wikipedia.org/wiki/Schwartzian_transform).

```javascript
function ten (options, query, count) {
  return options
    .map(calculateDist)
    .filter(isClose)
    .sort(asc)
    .map(first)
    .slice(0, count)

  function calculateDist (option) {
    return [ option, mindist(query, option.terms) ]
  }

  function isClose (pair) {
    return pair[1] <= Math.min(query.length - 1, 2)
  }

  function asc (a, b) {
    return a[1] - b[1]
  }

  function first (pair) {
    return pair[0]
  }
}
```

Some final touches would be clearing the input on click, and showing random options when the query is empty. Would love to hear your opinions, tweet [@aj0strow](https://twitter.com/aj0strow). 
