# ajostrow.me

install

```
$ npm install
$ brew install redis
```

start in development

```
$ redis-server > /dev/null &
$ npm start
```

test

```
$ export PATH="$PATH":node_modules/.bin
$ NODE_ENV=test mocha
```

article posted time

```
$ node -p '+new Date' | pbcopy
```
