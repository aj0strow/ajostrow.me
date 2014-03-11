After messing around for a couple hours, heres some fun facts. 

### Call Closures

You don't need parentheses when calling closures, just something to signify it is an expression and not a declaration. I like the bitflip tilde cause when have you ever used that for it's intended purpose?

```javascript
var ops = [];
+function () { ops.push('+'); } ();
-function () { ops.push('-'); } ();
!function () { ops.push('!'); } ();
~function () { ops.push('~'); } ();

ops; // [ '+', '-', '!', '~' ]
```

### Variable Scope

Obviously variables are only available in scope, but unlike most languages it's not important when they were added to the scope. 

```javascript
function greet () {
  return hello;
};

var hello = 'hello';

greet(); // 'hello'
```

This works for recursion as well.

```javascript
var rec = function (count) {
  if (count == 3) return count;
  rec(count + 1);
};

rec(0); // 3
```

### Vars Begin Undefined

All variables start off undefined in the declaration. Functions work recursively because the function name is added to the context, and only called after the function was defined. 

```javascript
var object = { a: object };
// { a: undefined }

var s = s || 'string';
// 'string'
```

### Binding Is Permanent

Binding a function to a context returns a new function, but you can't call that function in a different context. Makes sense actually, not sure when you'd want to. 

```javascript
~function () {
  console.log(this);
}.bind({ a: 'a' }).call({ b: 'b' });

// { a: 'a' }
```

### Functions Are Smart

Functions hold onto many things, including their name and what called them. 

```javascript
function isAnonymous () {
  return !isAnonymous.caller.name;
}

~function named () {
  console.log(isAnonymous());
} ();

// false

~function () {
  console.log(isAnonymous());
} ();

// true
```

A use case would be following the javascript pattern of a constructor providing both coersion and instantiation. 

```javascript
function Person (name) {
  if (this.constructor.name !== 'Person') {
    return new Person(arguments[0].name)
  } else {
    this.name = name;
  }
}

new Person('AJ');       // { name: 'AJ' }
Person({ name: 'AJ' })  // { name: 'AJ' }
```

### Inspecting Source

Using the trick of the caller property, it's straight-forward to see how node executes a file.

```javascript
~function expose () {
  console.log(expose.caller.toString());
} ();

// function (exports, require, module, __filename, __dirname) { 
//   ~function expose () {
//     console.log(expose.caller.toString());
//   } ();
// }
```

Go nuts :)

```javascript
expose.caller.caller.toString()
```



