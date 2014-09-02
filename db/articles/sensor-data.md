After working with sensors for about six months and failing, I've put some serious thought into storing time series data. Here are my organized thoughts on the perfect time series database prepared for Calem. 

### Past Attempts

There have been a number of attempts at time series databases, but each have critical flaws. 

* TempoIQ is "a complete solution" for "monitoring & analysis of sensor data"

* Influx is "a time series, events, and metrics database"

* Kairos is a "time series database written primarily for Cassandra"

* Cube is "a system for collecting timestamped events" that is "built on MongoDB"

All are fairly unknown and niche. The thing is nobody needs another database with a rich query interface, schema validation, indexes, collections, etc. We need somewhere to efficiently store time series data, and the ability to read back normalized aggregated values at arbitrary resolutions.

TempoIQ is the closest, but I need my database open source. It should focus on parallel resampling, fast aggregate rollups, and fault-tolerant storage. 

### Storage

Time series data is discrete readings. Those readings either actually represent something discrete like log events, or attempt to represent a continuous value. There are a few ways to store this data:

* JSON documents with fields and nested documents like Mongo.

* Table row with fields in a collection like Postgres.

* Vector of values for one entity like TempoIQ. (Yes!)

A flaw in other time series dbs is storing values in documents. They had to because they support rich queries, which I believe is a mistake. Documents add complexity and lend themselves to event style data which is a solved problem. 

Instead store data points like Tempo. Assume continuity and do not support event style data. For version one, every value should be numeric. 

Ok so we have time series (plural). There are a few ways to identify data. 

* User chosen string keys like Redis. (Yes!)

* Auto-incrementing primary keys like Postgres. 

* Time based or random UUIDs like Mongo. 

Time series data usually originates from a uniquely identified source like a sensor. The user can choose a UUID for the unique string anyway so there's no reason to enforce it. Auto-increment doesn't make sense because again time series (plural) are not created like tweets needing a unique identifier, they represent sensors. 

### Write

```
WRITE key timestamp value
```

Duplicates are the bane of data consistency. The nice thing about time series data is that it represents a unique point in time. Every write operation is conceptually a PUT request with the unique key, timestamp, and numeric value.

```
WRITE unique-key-001 2014-08-04T00:00:00.000Z 58.9238
```

Time series data inherently needs to support real-time writes, so I think it's best to choose Availability and Partition Tolerance over Consistency with the CAP theorem. The last value written is the one that is eventually available. 

There are two ways to handle data that only makes sense together like red, green, and blue values from a color sensor. One option is to support tuples.

```
WRITE unique-key-001 2014-08-04T00:00:00.000Z (20.054, 142.390, 50.422)
```

Another option is to allow transactions like Redis, and the developer would be responsible for grouping the values. 

```
MULTI
WRITE unique-key-001-r 2014-08-04T00:00:00.000Z 20.054 
WRITE unique-key-001-g 2014-08-04T00:00:00.000Z 142.390 
WRITE unique-key-001-b 2014-08-04T00:00:00.000Z 50.422
FLUSH
```

### Check The Value

```
CHECK key timestamp
```

We assume continuity so the value can be checked for a specific timestamp. For example writing a value on September 1st.

```
WRITE unique-key-002 2014-09-01T00:00:00.000Z 5.0
```

The value can be queried and the database will return the correct value. The following would return `5.0`. The timestamp would default to the current time. 

```
CHECK unique-key-002 2014-09-01T00:00:53.064Z
```

If the key doesn't exist or the timestamp is too early the value is null. Again this would have to support tuples or transactions. 

### Normalize Reads

```
READ key resolution timestamp [timestamp]
```

Reading back the exact data points is pointless. That's the event style of time series data. Instead the series is sliced at a *resolution* and values and averaged together, weighted by duration within the slice of time. 

For example to read back all data for August 1st at a one second resolution. 

```
READ unique-key-005 1000 2014-08-01:00:00:00.000Z 2014-08-02:00:00:00.000Z
```

This is probably expensive with a high volume of writes and long resolutions. One way to make it faster is to incrementally store resolution slices on writes. A *resolution index* would need to be configured tho. 

### Reduce Slices

```
REDUCE (fn ...) (key ...) resolution timestamp [timestamp]
```

The final step is to generate aggregations. Each series would be normalized in parallel and then the values for each timestamp would be reduced. For example to aggregate values for two keys. 

```
REDUCE (min max) (key-001 key-002) 1000 2014-08-01:00:00:00.000Z
```

This could potentially be sped up with vertual series that are configured ahead of time, and incrementally calculated on writes. 

### Custom Functions

```
DEFN fn script
```

The user should be able to write custom reduce functions. Any scripting language would work. I kind of like Julia's syntax for writing equations. 

For example to define an absolute value maximum function called "extreme".

```
DEFN extreme (v, x, y) -> max(v, abs(x), abs(y))
```

### Final Thoughts

I would write the database in Rust. 

1. There are already lots of databases written in C, C++, and Go, so it's less novel

2. Rust is approaching it's first big stable release, so there will more buzz than usual

3. Core Rust developers at Mozilla are more approachable than ever for help with debuggin and to get the word out

4. It would be a good narrative to have a new language like Rust power a new database that in turn powers the new Internet Of Things

When making choices, favor simplicity. Basically copy Redis as much as possible. 
