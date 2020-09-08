In React, to update the interface, the standard way is to replace existing state with new state. It's a classic rookie mistake to modify data in place, but it's also a mistake to make deep copies while performing updates. 

For state that includes objects and arrays, performing an update requires replacing the path of parent objects and arrays that contain the field. 

```js
const objects = [
    { field: 1 },
];

let nextObjects = objects.slice();

nextObjects[0] = {
    ...objects[0],
    field: 2,
};

setObjects(nextObjects);
```

It's a little verbose to copy the array and copy the object when all you want to do is update a single field. So developers will sometimes take a shortcut using the [lodash](https://lodash.com/) library.

```js
const objects = [
    { field: 1 },
];

// don't do this
let nextObjects = _.cloneDeep(objects);
nextObjects[0].field = 2;
```

For small apps, it works fine. For large apps, it freezes the page. 

### Shallow vs Deep

The reason `_.cloneDeep` does not scale is that it breaks equality comparisons by reference. 

In React the contract between a parent component and child component, when passing props, is that if the reference is the same the data is assumed to be the same, and vice versa. It's a performance optimization that allows fast equality checks. 

```js
// Fast. 
previousValue === nextValue;

// Varies from fast to slow. 
_.isEqual(previousValue, nextValue);
```

Comparison by reference, if done right, allows you to memoize child components that receive objects or arrays as props. 

### List Item Example

It can help to see the effect with a real world example. Here is a sequence of changes and renders for an example app that renders a blog post with comments. 

```js
const [comments, setComments] = useState([]);
```

```txt
BlogPost             <= render
  CommentList        <= render
```

```js
setComments([
    {id: 5, body: 'Nice post!'},
    {id: 8, body: 'Terrible code, this is all wrong.'},
]);
```

```txt
BlogPost             <= render
  CommentList        <= render
    CommentItem      <= render
    CommentItem      <= render
```

In the next change, only the new comment will render again. 


```js
setComments([
    ...comments,
    {
        {id: 12, body: 'Yikes, which part is wrong?', replyTo: 8},
    },
]);
```

```txt
BlogPost             <= render
  CommentList        <= render
    CommentItem
    CommentItem
    CommentItem      <= render
```

In the next change, only the updated comment will render again. 


```js
const nextComments = comments.slice();
const index = nextComments.findIndex(comment => comment.id === 8);
nextComments[index] = {
    ...comments[index],
    body: 'Edit: Actually the code looks fine.',
};
setComments(nextComments);
```

```txt
BlogPost             <= render
  CommentList        <= render
    CommentItem      <= render
    CommentItem
    CommentItem
```

It's not dramatic with only a few list items, however in practice some apps have hundreds or even thousands of list items.

### Clone Deep

The problem with `_.cloneDeep` is that it replaces all of the references. 

```js
// don't do this
const nextComments = _.cloneDeep(comments);
const index = nextComments.findIndex(comment => comment.id === 8);
nextComments[index].body = 'Edit: It keeps freezing on me.';
setComments(nextComments);
```

```txt
BlogPost             <= render
  CommentList        <= render
    CommentItem      <= render
    CommentItem      <= render
    CommentItem      <= render
```

```js
// don't do this
const nextComments = _.cloneDeep(comments);
nextComments.push({
    id: 14,
    body: 'Found it! The slowness is due to clone deep.',
});
setComments(nextComments);
```

```txt
BlogPost             <= render
  CommentList        <= render
    CommentItem      <= render
    CommentItem      <= render
    CommentItem      <= render
    CommentItem      <= render
```

It's fine for small apps because you can afford to render everything over and over, but for large apps it breaks the page because it's too much work to render everything. 
