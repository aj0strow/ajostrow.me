I've been reading [Joe Celko's SQL Programming Style](http://www.amazon.com/Celkos-Programming-Kaufmann-Management-Systems/dp/0120887975). He suggests using natural primary keys from the real world instead of generating arbitrary primary keys. The reason? It sucks migrating data with auto-increment keys.

### Auto-Incr Key

It's unfortunate that Rails promotes auto-incrementing keys, because they have limitations.

One issue with using an arbitrary primary key when a real-world natural key exists is that you need to add a unique index on the natural key anyway. Any unique key on not-null columns is by definition a primary key, so maintaining both is wasteful.

The second issue with auto-incrementing keys is migrating data between environments. When you use arbitrary integer foreign keys, you need to write migration scripts that export, re-write all the keys based on natural keys, and then import. So if you need to export and import by natural key anyway, why not use them in the first place?

I've read about when you have a database spread across multiple data centers, maintaining one central primary key sequence is a bottleneck. I've never had to scale past the Heroku Standard-0 so I wouldn't know.

So real-world primary keys are good and auto-incr keys are bad. However what about *new* content? Web content for example is created out of nothing, with no pre-existing unique identifier. 

I still think you want to avoid auto-incr keys for new content, because they prevent you from migrating data between environments without collision. Below are some options.

### Firebase Push ID

Firebase (acquired by Google) generates unique ids that:

> ... contains 120 bits of information. The first 48 bits are a timestamp, which both reduces the chance of collision and allows consecutively created push IDs to sort chronologically. The timestamp is followed by 72 bits of randomness ...
> - [The 2^120 Ways to Ensure Unique Identifiers](https://www.firebase.com/blog/2015-02-11-firebase-unique-identifiers.html)

So timestamp and randomness. They use a modified base64 character set to maintain sort order interop with their existing database. Each push id is 20 characters long and looks like:

```
 -JhLeOlGIEjaIOFHR0xd
```

It's short enough not to *completely* dominate a url.

```
https://www.example.com/posts/-JhLeOlGIEjaIOFHR0xd
```

### MongoDB Object ID

MongoDB was designed to run on multiple shards in a cluster, and therefore the system can't rely on a sequential integer id. The BSON specification includes an [Object ID](https://docs.mongodb.org/manual/reference/object-id/) described as:

> ObjectId is a 12-byte BSON type, constructed using:
> * a 4-byte value representing the seconds since the Unix epoch,
> * a 3-byte machine identifier,
> * a 2-byte process id, and
> * a 3-byte counter, starting with a random value.

It's a total of 12 bytes (96 bits), usually represented as a 24 character hex string.

```
5654b393416c65d66b000000
```

Or as part of a full website url.

```
https://www.example.com/posts/5654b393416c65d66b000000
```

It's shorter than Firebase Push ID in bytes, but the hex serialization makes it look longer.

### Node Short ID

The npm package **[dylang/shortid](https://github.com/dylang/shortid)** takes a similar approach by using a truncated timestamp and counter to select base64 characters from a shuffled alphabet. 

To keep the ids short, it uses a custom epoch instead of 1970 like the [unix timestamp](https://en.wikipedia.org/wiki/Unix_time), and encodes a version number which is incremented in source code when a new epoch is selected. 

> * By default 7-14 url-friendly characters: A-Z, a-z, 0-9, _-
> * Non-sequential so they are not predictable.
> * Supports cluster (automatically), custom seeds, custom alphabet.
> * Can generate any number of ids without duplicates, even millions per day.

The algorithm is based on timestamps, randomness, counters, and cluster ids to ensure uniqueness. The ids are short:

```
dBvJIh-H
```

The author suggests using it for url shorteners, which seems appropriate.

```
https://www.example.com/posts/dBvJIh-H
```

It's only implemented in Javascript, although it's open source and could be ported to other languages. The hard-coded version in the package would have to be kept in sync. 

### UUID

All the above options are excellent, but I wanted something with native Postgres support. UUIDs are standard tools to provide a unique identifier. Enable the extension in Rails in a migration:

```ruby
def change
  enable_extension 'uuid-ossp'
end
```

The only reason I didn't jump at UUIDs in the first place is that the hex representation is uncomfortably long.

```
7aa7bb93-e219-48a2-b786-0137a865acd8
```

The 36 characters absolutely dominates the url and looks terrible.

```
https://www.example.com/posts/7aa7bb93-e219-48a2-b786-0137a865acd8
```

However [Wikipedia states](https://en.wikipedia.org/wiki/Universally_unique_identifier):

> A UUID is simply a 128-bit value.

The issue isn't the amount of data, it's the hex representation with dashes. Remember how Firebase uses 120 bits encoded in 20 chars and Mongo uses 96 bits encoded in 24 chars. 

### Base58 UUID

So each UUID is 128 bits. Therefore each UUID could be `128 / 4 = 32` or four 32-bit integers. 

```ruby
require 'securerandom'

uuid = SecureRandom.uuid
# 7aa7bb93-e219-48a2-b786-0137a865acd8

base16 = uuid.delete('-')
# 7aa7bb93e21948a2b7860137a865acd8

numbers = [ base16 ].pack('H*').unpack('L4')
# [ 2478548858, 2722634210, 922846903, 3635176872 ]
```

Base64 is the logical encoding, but 64 characters exceeds the alphabet `[A-Za-z0-9]` by 2. I don't like dashes or underscores in primary keys because they are often used as logical separators. It also occurred to me that Bitcoin uses base58 for wallets, so there was probably an implementation online. 

```
# $ gem install base58
require 'base58'

Base58.encode(uuid.delete('-').to_i(16))
# g9t6XEtYhYX6XFkZibpoRf
```

It's between Firebase and Mongo length at 22 characters. 

```
https://www.example.com/posts/g9t6XEtYhYX6XFkZibpoRf
```

It's pretty long, but this way the user gets random looking ids, and the database can use native UUIDv4 binary ids. Everyone wins. Tweet [@aj0strow](https://twitter.com/aj0strow) to discuss more.
