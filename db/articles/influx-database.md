Get started by installing and running.

```
$ brew update
$ brew install influxdb
```

Read the homebrew post-install instructions for options to load on boot, use launchctl, etc. I chose to just alias it.

```
$ alias 'influxdb'='influxdb -config=/usr/local/etc/influxdb.conf > /dev/null &'
$ influxdb
```

### Read & Write

Go to the web ui (http://localhost:8083), and create a new database user and password. Create a new database. Locally, use `root` for the username and password. 

I tested writing and reading back data with a node script. The web ui should also show the data if you click *explore data*. 

```javascript
// influx_test.js

var influx = require('influx')
var config = {
  host: "localhost",
  database: "db_name_here"
}

var client = influx(config)

var points = [
  { time: new Date(), x: 5, y: 20 },
  { time: new Date(), x: 8, y: 22 }
]

client.writePoints('unique-id-here', points, {}, function (e, response) {
  if (e) throw e

  var query = 'select * from unique-id-here'
  client.query(query, function (e, response) {
    if (e) throw e
    console.log(response)
  })
})
```

Install and run with node. 

```
$ npm install influx
$ node influx_test
```

### Deploy

To deploy the database spin up an Ubuntu VM and install in the ssh prompt as a sudo user.

```
$ wget http://s3.amazonaws.com/influxdb/influxdb_latest_amd64.deb
$ sudo dpkg -i influxdb_latest_amd64.deb
$ sudo /etc/init.d/influxdb start
```

Ignore the output of the commands. After the second one it says "FAILED" but it's really fine. Next create a database and user with internal http requests using `curl`. 

```
$ curl -X POST -d '{ "name": "db_name_here" }' \
  'http://localhost:8086/db?u=root&p=root'
```

Add a user to the database as well. 

```
$ curl -X POST -d '{ "name": "user", "password": "long pass" }' \
  'http://localhost:8086/db/db_name_here/users?u=root&p=root'
```

You can now connect to the ip address and port with a client library, and read and write data. You can't do administrative tasks tho, because the user only has access to the one database. 

Test the new database with the same node script, changing the config.

```javascript
var config = {
  host: "###.###.###.###", // ip address
  database: "db_name_here",
  username: "user",
  password: "long pass"
}
```

### Security

*More on security to come.*
