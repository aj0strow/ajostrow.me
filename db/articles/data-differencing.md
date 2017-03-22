I'm writing a mobile trading app called "Pilot". The data requirements are different from standard clients because you need ongoing reads. The correct approach is data differencing. 

> Formally, a data differencing algorithm takes as input source data and target data, and produces difference data such that given the source data and the difference data, one can reconstruct the target data ...
> 
> -- [Data differencing, Wikipedia](https://en.wikipedia.org/wiki/Data_differencing)

For example, compressing quotes.

```
client: SUBSCRIBE /quotes/USD-CAD

server: {"bid":"1.338010","offer":"1.338020"}
server: {"bid":"1.338000"}
server: {"bid":"1.337990"}
server: {"bid":"1.337900","offer":"1.337960"}

client: UNSUBSCRIBE
```

When there are no changes within the time frame, `"offer"` is excluded. 

### Differencing

The server compresses outbound messages by comparing the current message with the previous message, calculating the *difference*, saving the current message, and sending the *difference*.

```
stream -> slidingWindow(2) -> map(diff)
```

It can be cumbersome to calculate the delta in type-safe languages. I chose to write differencing logic once per entity instead of spending time working through a general purpose transform. 

```
// differencing

    delta = new()
    if b.Bid != a.Bid {
        delta.Bid = b.Bid
    }
    if b.Offer != a.Offer {
        delta.Offer = b.Offer
    }
    return delta
```

Avoid sending empty deltas.

```
// subscription

    WaitThrottleTimer()
    message = backend.GetMessage()
    delta = compression.Diff(lastMessage, message)
    lastMessage = message
    if !delta.IsEmpty() {
        client.SendMessage(detla)
    }
```

It's good practice to send a complete message every now and then to reset the compression, in case the client drops some frames and misses an infrequent update. The exact frequency depends on the app and throttle rate. 

### Patching

The client decompresses the message by patching the last message with the current message. I usually implement patching using an `Rx.Observable` and `scan()`. 

```
stream -> scan(patch)
```

Luckily patching is easier than differencing. Overwrite the existing message fields with patch fields. It's better to rebuild the complete domain object before firing events. 

### Data Model

Differencing and arrays don't mix. Firebase wrote ["Arrays Are Evil"](https://firebase.googleblog.com/2014/04/best-practices-arrays-in-firebase.html#arrays-are-evil) back in 2014. You can use a more advanced patch object like [JSON Patch](http://jsonpatch.com/) but the point is to save bytes. 

Instead, use lookups by primary key.

```
client: SUBSCRIBE /orders

server: {"a8s987dfx23":{"id":"a8s987dfx23","size":"500000","status":"pending"}}
server: {"a8s987dfx23":{"status":"accepted"}}
server: {"a8s987dfx23":{"status":"filled"}}
```

If you use TypeScript, define a lookup interface to convey intent.

```ts
type Lookup<T> = Record<string, T>;
```

### Byte Saving

The big wins of differencing is when data entities have some fields that change frequently and other fields that change infrequently. Let's expand our quote object to include yesterday's close price.

```
server: {"bid":"1.338010","offer":"1.338020","close":"1.337820"}
server: {"bid":"1.338000"}
server: {"bid":"1.337990"}
server: {"bid":"1.337900","offer":"1.337960"}
```

The stream after the first event is identical while providing the client more information. 
