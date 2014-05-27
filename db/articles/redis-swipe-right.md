I love Redis. Let's build Tinder with Redis. 

### Install

```
$ brew install redis
$ redis-server
```

Its kind of annoying to have redis take up a terminal window, so alias it to run in the background.

```
# ~/.bashrc
alias 'redis-start'='redis-server > /dev/null 2>&1 &'
```

Then starting it is not a problem.

```
$ redis-start
```

### Design

Redis uses key-value pairs to store data. Unlike traditional data stores, Redis will *not* generate a primary key for you. You need to choose one. (Pick a string, any string). This means it's up to the application to correctly map data between key-value pairs. There are no joins. 

Redis does not separate data into collections. Instead there's one big keyspace. Developers generally use colon-delimited keys to add context. For example `tinder:users:aj0strow` could be where my user profile is stored. 

Note the `tinder` prefix. It's good practice to prefix every key with a unique namespace so other packages can share the same database without conflicts. For example, background job queues often use redis.

### User Profile

When a user signs up with Facebook, the profile is created and default settings filled in. Real Tinder keeps track of images, interests, etc. but let's keep it simple. 

```
{
  id: String,
  name: String,
  birthdate: Date,
  gender: String,
  location: {
    locality: String,
    coords: { lat: String, lon: String }
  },
  settings: {
    gender: String,
    distance: Integer,
    ages: Integer Range
  }
}
```

Redis works really well when a primary key, like a facebook uid, is already available. 

```
users:$facebook_id
```

Redis doesn't do nested structured data, but we don't need it for Tinder. The whole profile is seralized as JSON and stored as a string. See commands [SET](http://redis.io/commands/get) and [GET](http://redis.io/commands/set). 

```ruby
SET users:aj0strow '{ json user }'
GET users:aj0strow
```

The user id should be hashed and stored in a secure session on the client (iPhone) with rotated keys. That's out of the scope of this tutorial tho. 

Next, Tinder matches you with people in the area.

### Potential Matches

Out of every user on Tinder, only a subset are potential matches. The criteria depend on each user's individual settings. We'll keep a set of users in any given locality, and then filter them on the application server, pushing potential matches onto a queue. 

To filter all users in a locality, we need all users in a locality. More schema!

```
locations:$locality
```

At the start of each session, we remove the user from the old locality, and add to the new locality. See the [SADD](http://redis.io/commands/sadd) and [SREM](http://redis.io/commands/srem) commands. 

```
SREM locations:toronto aj0strow
SADD locations:montreal aj0strow
```

Even though these are two different operations, the idea is moving my id from one set to the other. It should be *atomic*. Redis provies transactions for grouping commands. See [MULTI](http://redis.io/commands/multi) and [EXEC](http://redis.io/commands/exec). 

```
MULTI
SREM locations:toronto aj0strow
SADD locations:montreal aj0strow
EXEC
```

Transactions have the added benefit that the commands are sent in one round-trip to the Redis server. 

One option for reading potential user ids from the set is to grab them all, but that would be taxing for places like Tokyo, with potentially millions of people on Tinder. Instead, we can scan with a cursor. See the [SSCAN](http://redis.io/commands/sscan) command. 

```
SSCAN locations:montreal 0 COUNT 100
```

The return value includes the next value to pass to the cursor and returned values. Ror example 133 could be the next cursor. Then you'd call SSCAN again with 133 instead of 0 to get the next 100 values. Note: The count and the next cursor value are unrelated. If the next cursor is 0, then it's the end of the iteration. 

### Queue

We need a queue for potential matches for the session. It could be a set with user ids, but it makes more sense to push the whole json profile into the queue because the list is generated each time from a set, so the list should remain unique. 

```
users:$facebook_id:queue
```

Each time Tinder opens, we clear the queue and rebuild it. (In the future, we would optimize this to only run if the location changes substantially). Deleting the key associated with the list will clear all the contents. See the [DEL](http://redis.io/commands/del) command. 

```
DEL users:aj0strow:queue
```

After fetching 100 user ids, each one needs to be looked up and checked for a match. Basically check distance, gender, age (left as an exercise). See the [RPUSH](http://redis.io/commands/rpush) command. 

```
RPUSH users:aj0strow:queue '{ json user }'
```

After a few cursors, it's probably safe to start serving profiles to the user, the queue can continue to be built in the background. Time for swiping left or right. 

### Skips

We need to keep track of which users like whom. The first case is a skip (swipe left). Sets work well for this. 

```
users:$facebook_id:skips
```

A naive approach would be to store the skips with the current user. The following would be *BAD*. 

```
SADD users:aj0strow:skips julia-lang
```

Instead, we believe in second chances. 

```
SADD users:julia-lang:skips aj0strow
```

This way, when Julia Lang updates her profile, we need not iterate every `users:*:skips` key to remove `julia-lang` from the set. Instead, we remove the skips directly. 

Each time Julia changes her profile, we set the ttl (time to live) for her skips to a day's time. That way if she changes her profile too much, it never clears. See [EXPIRE](http://redis.io/commands/expire). 

```
EXPIRE users:julia-lang:skips 86400
``` 

When filtering user ids, we needa check to make sure I haven't already skipped the user. See [SISMEMBER](http://redis.io/commands/sismember). 

```
SISMEMBER users:julia-lang:skips aj0strow
```

### Likes

Except you know I'm swiping right for Julia Lang. Let's keep track of likes. For consistency we store likes counterintuitively like skips.

```
users:$facebook_id:likes
```

We add the like, and check if she likes me back in a transaction.

```
MULTI
SADD users:julia-lang:likes aj0strow
SISMEMBER users:aj0strow:likes julia-lang
EXEC
```

### Matches

She likes me back. "You have a match!" Time to add matches to the schema. Back to intuitive key structure. 

```
users:$facebook_id:matches
```

Tinder sorts conversations by most recent to least recent in activity. Redis ordered sets using milliseconds since the epoch will work for reverse chronological order. See [ZADD](http://redis.io/commands/zadd).

```
MULTI
ZADD users:aj0strow:matches 1401148915195 julia-lang
ZADD users:julia-lang:matches 1401148915195 aj0strow
EXEC
```

It's unlikely a user has thousands of matches, so it's safe to grab all the matches without a cursor. We want reverse (descending) order by score (time). See [ZREVRANGE](http://redis.io/commands/zrevrange). 

```
ZREVRANGE users:aj0strow:matches 0 -1
```

### Messages

We work up the courage to break the ice, and it's time to store messages. They belong to two users, so the key must be a combination of our two ids (how romantic, nu?). 

```
messages:$hashcode
```

Our simple hashing will be to combine the ids in alphabetic order with a hash symbol. Facebook ids couldn't have a hash symbol in urls, so it should be safe. 

To add messages, see the [LPUSH](http://redis.io/commands/lpush) command to prepend messages.

```
LPUSH messages:aj0strow#julia-lang '{ json message }'
```

It's unlikely for users to message thousands of times before exchanging snapchat contacts, so we can pull all the messages from the conversation. See [LRANGE](http://redis.io/commands/lrange). 

```
LRANGE messages:aj0strow#julia-lang 0 -1
```

### Real-Time

Tinder wouldn't be much fun without the real-time aspect of notifications, matches, and messages. It's important to reject subscriptions to channels the user should not have access to. 

```
SUBSCRIBE aj0strow
```

Each time a match or message is created, we broadcast the event to each client listening. See [PUBLISH](http://redis.io/commands/publish). 

```
MULTI
PUBLISH aj0strow '{ json notification }'
PUBLISH julia-lang '{ json notification }'
EXEC
```

At the end of the session, clean up the connections.

```
UNSUBSCRIBE aj0strow
```

### Final Schema

Again, schema isn't exactly the right word, but regardless:

```
KEYS

users:$facebook_id (string)
locations:$locality (set)
users:$facebook_id:queue (list)
users:$facebook_id:skips (set)
users:$facebook_id:likes (set)
users:$facebook_id:matches (sorted set)
messages:$hashcode (list)

CHANNELS

$facebook_id
```

Likely simpler than whatever Tinder actually uses. 

### Further Learning

We just touched on a few simple redis operations. It can do a *lot* of interesting things. 

* Check out [SINTER](http://redis.io/commands/sinter) for common friends and interests.

* Check out the [List of Client Libraries](http://redis.io/clients) and implement something. 

* Deploy a Redis instance, monitor it, back it up, clear it, restore it. (Maybe a future article?)

Questions, comments? Tweet [@aj0strow](https://twitter.com/aj0strow).
