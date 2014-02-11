It's annoying to need a new command prompt for each database server. Instead, this will walk you how to set up redis in the background.

### Install With Homebrew

First, install redis:

```
$ brew update
$ brew install redis
```

Start the server and you'll see some nice ascii art:

```
$ redis-server
^CTRL-C
```

### Daemon Script

If you go into /Library/LaunchDaemons/ you'll see other scripts, some of which are automatically booted on start. Don't be turned off by the domain namespaced filenames or the archaic xml format -- these are bash commands!

```
$ sudo edit /Library/LaunchDaemons/io.redis.redis-server.plist
```

And put the following (a bit cut off, so copy-paste):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-/Apple/DTD PLIST 1.0/EN" "http:/www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
   <key>Label</key>
   <string>io.redis.redis-server</string>
   <key>ProgramArguments</key>
      <array>
         <string>/usr/local/bin/redis-server</string>
         <string>/usr/local/etc/redis.conf</string>
      </array>
   <key>RunAtLoad</key>
   <false/>
</dict>
</plist>
```

Make the daemon available:

```
$ launchctl load /Library/LaunchDaemons/io.redis.redis-server.plist
```

Now redis can be started in the background:

```
$ launchctl start io.redis.redis-server
$ redis-cli ping
PONG
$ launchctl stop io.redis.redis-server
```

### Bash Aliases

Open or create a bash aliases file and add the following:

```sh
# ~/.bash_aliases

alias 'redis.start'='echo "redis starting"; launchctl start io.redis.redis-server'
alias 'redis.stop'='echo "redis stopping"; launchctl stop io.redis.redis-server'
```

Close and open to a new terminal, and you should be able to start and stop redis with ease:

```
$ redis.start
redis starting
$ redis.stop
redis stopping
```

### Notes

The default host and port for development redis server:

```
localhost:6379
```