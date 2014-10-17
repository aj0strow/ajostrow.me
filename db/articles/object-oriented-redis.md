Every web application needs [redis](http://redis.io/) at some point, especially when written in ruby. Let's start with a skills set for users. 

### The Pain

The goal is to add and remove skills, and calculate shared skills.

```ruby
user.skills_add('ruby')
user.skills_remove('ruby')
```

Straight forward with a global redis connection.

```ruby
class User
  def skills_add(skill)
    $redis.sadd("users:#{id}:skills", skill)
  end

  def skills_remove(skill)
    $redis.srem("users:#{id}:skills", skill)
  end
end
```

The key can be factored out, and skill intersection is a redis command away.

```ruby
  def skills_key
    "users:#{id}:skills"
  end

  def skills_intersect(user)
    $redis.sinter(redis_key, user.redis_key)
  end
```

It works. However consider the mountain of code should users need shared cities, interests, albums, or any additional sets. 

### Redis Wrap

The problem is that we're using redis in a functional style. Calling a command is much like passing it as a first argument.

```ruby
$redis.send(:command, 'key', arguments...)
```

So when different commands need to be called on the same key you have a lot of repetition.

```ruby
redis(:sadd, 'users:3:skills', 'ruby')
redis(:srem, 'users:4:skills', 'ruby')
```

The order of the arguments is wrong for partial applicaiton which would help us refactor out the key. For example imagine if the first argument were the key.

```ruby
redis('users:3:skills', :sadd, 'ruby')
```

This changes everything, because now a partially applied redis command is acting on the object represented by the key.

```ruby
skills = redis('users:3:skills)
skills(:sadd, 'ruby')
```

It looks like more code, because it takes two lines, but the implications are massive. Instead of calling redis commands and keeping track of database keys, the code acts on redis objects. It's the same type of abstraction active record uses.

```ruby
user.skills.sadd('ruby')
user.skills.srem('ruby')
```

To implement the nicer object-oriented syntax the redis string needs to be partially applied before the method is known.

```ruby
class User
  def skills
    Redis::Wrap.new("users:#{id}:skills")
  end
end
```

Assuming the wrap returns the key as an alias for the `to_s` method, wraps and string keys can be used interchangably in commands.

```ruby
user_a.skills.sinter(user_b.skills)
```

### Implementation

The code is open source at **[aj0strow/redis-wrap](https://github.com/aj0strow/redis-wrap)**. It boils down to just a few lines to hold onto the key in an instance variable and inject it as the first argument to all redis commands.

```ruby
class Redis
  class Wrap
    attr_reader :key

    def initialize(key)
      @key = key.to_s
    end

    def method_missing(command, *arguments, &block)
      redis.send(command, key, *arguments, &block)
    end

    def redis
      Redis.current
    end

    alias_method :to_s, :key
  end
end
```

**Doesn't redis-objects already exist?** Yes, but I have a few bones to pick with it. They chose to follow the ruby apis while I prefer to follow the redis api so I can browse the documentation, find the method I want, and use it immediately without then looking up the corresponding ruby object documentation and guessing which corresponds to which. Also, it bothers me that every ruby package finds the need to have a DSL. Writing methods is not challenging, and involves less magic. 

Pull requests welcome on the `redis-wrap` project. Tweet ideas and thoughts [@aj0strow](https://twitter.com/aj0strow).
