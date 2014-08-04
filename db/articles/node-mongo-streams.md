Node is well-known for asynchronous io. The real power of Node lies not in callbacks or promises tho, but in async streams. I want to start with an analogy on streams, and then a practical example of recreating minimal [mongoimport](http://docs.mongodb.org/manual/reference/program/mongoimport/) and [mongoexport](http://docs.mongodb.org/v2.2/reference/mongoexport/) commands supporting the -d and -c options.

### Garden Hose

Imagine a garden hose with water coming from a faucet source and flowing to a destination. The water will never flow backwards back into the source, so the water is consumed irreversibly. At some point the faucet is turned off. 

Streams are similar. Data chunks come from a source, and are consumed one at a time (like a cross-section of water) until the stream is turned off. With Node streams, a chunk is usually a buffer, but can also be a string or json object. 

There are only two things to do with a stream: write data to it or read data from it. You write to a *writable* stream and read from a *readable* stream. Simple enough. You both read from and write to a *duplex* stream, which is where it gets interesting. 

Back to the garden analogy. 

* The faucet source is a readable stream. So is a file in read mode, or an http request. 
* The garden hose is a duplex stream. Gzip compression off the top of my head is too. 
* The plant would be a writable stream. So is a file in write mode, or an http response. 

Streams are really everywhere tho. Command line programs use three [standard streams](http://en.wikipedia.org/wiki/Standard_streams) *stdin*, *stdout*, and *stderr*. Standard streams are joined using the pipe operator.

```sh
$ cat filename.js | grep phrase
```

Node streams are implemented on top of libuv which means events. The [stream docs](http://nodejs.org/api/stream.html#stream_api_for_stream_consumers) cover every event, but in reality you'll usually implement the appropriate [private methods](http://nodejs.org/api/stream.html#stream_api_for_stream_implementors) and pipe things together. 

### Mongo Setup

First things first make sure mongodb is working. (Stream io redirection in the second command. *Streams are everywhere.*)

```sh
$ brew install mongodb
$ mongod >/dev/null &
$ npm install mongojs
```

Next seed some random data in database `abc` using **[mafintosh/mongojs](https://github.com/mafintosh/mongojs)**.

```javascript
// seed.js

var mongojs = require('mongojs')
var db = mongojs('abc', [ 'numbers' ])

var docs = []
for (var i = 0; i < 100000; i++) {
  docs.push({ index: i, value: Math.random() * 100 })
}

db.numbers.insert(docs, function (e) {
  if (e) { console.error(e) }
  db.close()
})
```

Run the seed script and check the documents were inserted.

```sh
$ node seed.js
$ mongo abc --eval 'db.numbers.count()'
100000
```

### Export

The first step is to export the data. The mongodb client provides cursors that stream json objects so the only step left is to pipe the object stream through a json stringify transform. 

```sh
$ npm install minimist
$ npm install JSONStream
```

```javascript
// mongoexport.js

var minimist = require('minimist')
var mongojs = require('mongojs')
var JSONStream = require('JSONStream')

var argv = minimist(process.argv.slice(2))
var database = argv.d
var collection = argv.c

var db = mongojs(database, [ collection ])
var cursor = db[collection].find({})

cursor.on('error', function (e) {
  console.error(e)
})
cursor.on('end', function () {
  db.close()
  process.stdout.write('\n')
})

cursor.pipe(JSONStream.stringify(false)).pipe(process.stdout)
```

Try it out.

```sh
$ node mongoexport.js -d abc -c numbers > numbers.json
$ cat dump.json | wc -l | bc
100000
```

### Import

The next step is to persist a stream of json strings to the database and collection of choice. Same basic structure.

```javascript
// mongoimport.js

var minimist = require('minimist')
var mongojs = require('mongojs')
var JSONStream = require('JSONStream')

var argv = minimist(process.argv.slice(2))
var database = argv.d
var collection = argv.c

var db = mongojs(database, [ collection ])
var stream = process.stdin.pipe(JSONStream.parse())

stream.on('error', function (e) {
  console.error(e)
})

var count = 0
stream.on('data', function (data) {
  count += 1
  db[collection].insert(data, function (e) {
    if (e) { console.error(e) }
    count -= 1
    if (count == 0) { db.close() }
  })
})
```

Try it out.

```sh
$ node mongoimport.js -d xyz -c numbers < numbers.json
$ mongo xyz
> db.numbers.count()
100000
> db.numbers.remove()
> exit
```

### Copy

With exporting and importing complete there is no need for the intermediary json file. The export command can be piped directly into the import command. First some vanity tho.

Remove the `.js` file extension from each command. Add a hashbang as the first line of each file.

```sh
#!/usr/bin/env node
```

Finally make the scripts executable.

```
$ chmod +x mongoimport
$ chmod +x mongoexport
```

The commands are ready! Stream the entire numbers collection from the `abc` database to the `xyz` database.

```sh
$ ./mongoexport -d abc -c numbers | ./mongimport -d xyz -c numbers
```

Pretty fast eh? Tweet [@aj0strow](https://twitter.com/aj0strow) with comments, questions, etc.
