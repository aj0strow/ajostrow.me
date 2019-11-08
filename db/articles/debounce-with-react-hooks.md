
Imagine you're building a form that requires picking a username. 

```jsx
function Form() {
  const [username, setUsername] = useState('');
  const onChange = (e) => setUsername(e.target.value)
  return (
    <form>
      <input type="text" onChange={onChange}>
      <button type="submit">Sign up</button>
    </form
  )
}
```

It would be annoying to type in a username and submit the form only to find out the username is already taken. In order to check the availability it requires making a network request.

### Every Input Change

A naive solution might check the availability on every input change. 

```js
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    fetch(`/users/${username}`).then(response => {
        setAvailable(response.status === 404)
    })
  }, [username])
```

The code above has multiple errors. 

* It will request the wrong resource from the server if the username is blank. 
* It only includes two states `true` or  `false` when there are really four possible states `'available'` or `'not available'` or `'pick something'` if the username is blank, or `'not sure checking'` during a network request.
* It displays the wrong availability if the username changes quickly and responses come back out of order. 

We can do better. 

```js
  const [availability, setAvailability] = useState('pick something');
  useEffect(() => {
    if (!username) {
      setAvailability('pick something')
      return
    }
    setAvailability('not sure checking')
    let aborted = false
    fetch(`/users/${username}`).then(response => {
      if (aborted) {
        return
      }
      if (response.status === 404) {
        setAvailability('available')
      } else if (resopnse.status === 200) {
        setAvailability('not available')
      }
    })
    return () => {
      aborted = true
    }
  }, [username])
```

It works, but it sends a lot of HTTP requests while the user is typing. 

### Debounce & Memoize

It's never good to make a network request on every key press. Ideally it should check if the username is available after the user is finished typing.

```js
import { debounce } from 'lodash'
``` 

That being said, it's easier said than done. It's not obvious how to debounce methods in React functional components. React will call the functional component on every render which replaces the debounced function with a new debounced function. 

```js
  const checkAvailability = () => {
    // fetch from server ...
  }

  // does not work
  useEffect(debounce(checkAvailability, 500), [username])
```

If you try to pass a debounced function to `useEffect` it delays but still performs a network request on every input change. The debounced function is a new copy on every render so it thinks it is being called for the first time. 

React has a `useCallback` hook to memoize the function between renders. 

```js
  const checkAvailabilityAfterTyping = useCallback(debounce(checkAvailability, 500), [])
  useEffect(checkAvailabilityAfterTyping, [username])
```

It doesn't work to memoize the function without passing in arguments. The memoized copy of `checkAvailability` is referencing the username from the *first component render*. 

The answer is to pass the username and a signal to abort as function arguments. 

```js
  const checkAvailability = (username, signal) => {
    if (!username) {
      setAvailability('pick something')
      return
    }
    setAvailability('not sure checking for you')
    fetch(`/users/${username}`).then(response => {
      if (signal.aborted) {
        return
      }
      if (response.status === 404) {
        setAvailability('available')
      } else if (resopnse.status === 200) {
        setAvailability('not available')
      }
    })
  }
  const checkAvailabilityAfterTyping = useCallback(debounce(checkAvailability, 500), [])
  useEffect(() => {
    const signal = {}
    checkAvailabilityAfterTyping(username, signal)
    return () => {
      signal.aborted = true
    }
  }, [username])
```

It finally works. 

### Set & Clear Timeout

It can be simpler to set and clear timeouts instead of using a library `debounce` function. 

```js
  useEffect(() => {
    let aborted = false
    const timerId = setTimeout(() => {
      if (!username) {
        setAvailability('pick something')
        return
      }
      setAvailability('not sure checking for you')
      fetch(`/users/${username}`).then(response => {
        if (aborted) {
          return
        }
        if (response.status === 404) {
          setAvailability('available')
        } else if (resopnse.status === 200) {
          setAvailability('not available')
        }
      })
    }, 500)
    return () => {
      aborted = true
      clearTimeout(timerId)
    }
  }, [username])
```

It's not obvious how to debounce network requests in React functional components. I hope the two patterns in this article can help, namely memoizing a debounced function or setting and clearing timeouts. 
