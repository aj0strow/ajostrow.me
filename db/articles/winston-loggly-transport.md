Loggly is a great service that basically turns logging events into a dashboard of analytics. There's a bit of a learning curve though!

### Loggly + Winston

First, create an account at http://www.loggly.com/, with a free month trial. Click on the customer tokens tab, and you should see a really long dash-separated string of letters and numbers. That's the token.

Next, install winston and winston-loggly using npm.

```
$ npm install winston --save
$ npm install winston-loggly --save
```

Then create a simple logger using both the transports:

```javascript
// logger.js

var winston = require('winston');
require('winston-loggly');

// create loggly transport
var logglyTransport = new (winston.transports.Loggly)({
   subdomain: 'subdomain',
   inputToken: 'input-token-owafoa-w39hf9oawhf',
   json: true
});

// Loggly Gen 2 only:
Object.defineProperty(logglyTransport.client.config, 'inputUrl', {
   value: 'https://logs-01.loggly.com/inputs/',
   enumerable: true,
   configurable: true
});

// create winston logger
var logger = new (winston.Logger)({
   transports: [
      new (winston.transports.Console),
      logglyTransport
   ]
});

// test it out
logger.info('{winston} configured');

module.exports = logger;
```

If you run the logger script directly, you should see the log show up on the Loggly dashboard. Make sure to require your new logger instead of using console.log in the rest of your application:

```javascript
// application.js

var logger = require('./logger');
```
