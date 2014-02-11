var redis = require('then-redis');
module.exports = redis.createClient(process.env.REDISCLOUD_URL);