JavaScript is known as an asynchronous language, with libraries like [Async](https://github.com/caolan/async) to get work done in parellel. That made me wonder, how hard would it be to do something similar in ruby?

Looking at the async library, they offer most standard list operations, but I'll just do Array#map. In typical ruby fashion, it'll take a block. 

```ruby
module Async
    
  def self.map(items)
    threads = items.map do |item|
      Thread.new{ yield(item) }
    end
    threads.map(&:value)
  end
    
end
```

Let's see if that actually runs in parallel:

```ruby
require 'benchmark'

puts Benchmark.measure{ (1..10).map do sleep(1) end } 
puts Benchmark.measure{ Async.map(1..10) do sleep(1) end }
```
Output:

```
  0.000000   0.000000   0.000000 ( 10.001101)
  0.010000   0.010000   0.020000 (  1.010845)
```

And it does! The first sequential map took 10 full seconds, while the asynchronous map took just over 1 second. The sleeping (or blocking) happened in parallel. 