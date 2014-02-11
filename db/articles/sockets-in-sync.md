It's possible to write scalable real-time web apps that are insanely fast using node, redis, and websockets. This example keeps a live user count. 

### Reading

The app is written in [coffee-script](http://coffeescript.org/). A great intro is [Aseem's slideshare](http://aseemk.com/talks/intro-to-coffeescript).

Read the [fifteen minute introduction to redis](http://redis.io/topics/data-types-intro). It's billed as a key-value store, but is really a full-blown nosql option. 

Also check out the [Promises/A+ specification](http://promises-aplus.github.io/promises-spec/) if promises are new. The redis interaction code is async even though it doesn't look it. 

### Live User Count

Here's the sample app, one bit at a time. First we connect to the redis database (just localhost for now) and set the user count at 0 if it doesn't exist yet. 

```coffeescript
redis = require 'then-redis'

db = redis.createClient()
db.setnx('users:count', 0)
```

Next we need an application to connect with the client and serve the html index page.

```coffeescript
express = require 'express'
http = require 'http'

app = express()
index = (req, res) ->
  res.sendfile(__dirname + '/index.html')
app.get('/', index)

server = http.createServer(app)
server.listen(process.env.PORT)
```

The markup is bare-bones for connecting to the server, upgrading to a socket, and logging the new user count. 

```html
<!DOCTYPE html>
<html>
  <head></head>
  <body>
    <script src="/socket.io/socket.io.js"></script>
    <script>
      var socket = io.connect('http://localhost');
      socket.on('users:count', function (data) {
        console.log(data);
      });
    </script>
  </body>
</html>
```

The last step is to listen for new connections with socket.io, publish to redis, and relay all messages from redis to the sockets.

```coffeescript
io = require 'socket.io'

sockets = io.listen(server).sockets
key = 'users:count'

onconnect = (socket) ->
  publish = db.publish.bind(db, key)
  db.incr(key).then(publish)
  socket.on('disconnect', -> db.decr(key).then(publish))
sockets.on('connection', onconnect)

client = redis.createClient()
client.on('message', sockets.emit.bind(sockets))
client.subscribe(key)
```

### Horizontally Scaled

If you start multiple servers on different ports, clients on all ports will get the real-time count across servers. 

```
$ npm i -g coffee-script
$ npm i socket.io express then-redis
$ redis-server &
$ PORT=3000 coffee app.coffee &
$ PORT=3001 coffee app.coffee &
$ open http://localhost:3000
$ open http://localhost:3001
```

Open up the browser console and the numbers should be in sync! 

Keeping track of live users is a trivial example, but the possibilities are huge when you consider redis ordered sets. Code is available as a gist as well (https://gist.github.com/aj0strow/8820581). 
