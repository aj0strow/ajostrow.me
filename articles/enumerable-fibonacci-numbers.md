I learned something new a few minutes ago- you only need to define the "each" method in a custom Ruby class, and then you can include the [Enumerable module](http://ruby-doc.org/core-2.0/Enumerable.html). 

For those unaware, the Enumerable module gives arrays, ranges, and a bunch of other collections all of the cool features like "map", "reduce", "filter", "chunk", "each_slice" etc.

A practical example is the [2nd Project Euler problem](http://projecteuler.net/problem=2), which asks for the sum of the even-valued terms in the Fibonacci sequence whose values do not exceed four million.

To start, the Fibonacci class:

```ruby
class Fibonacci
  
  include Enumerable
  
  def initialize(stop)
    @smaller, @larger, @stop = 1, 2, stop
  end
  
  class << self
    alias :up_to :new
  end
  
  def each
    while @smaller < @stop
      yield(@smaller)
      @smaller, @larger = @larger, @smaller + @larger
    end
    @smaller, @larger = 1, 2
  end
  
end
```

A quick note on parallel assignment: the variable assignments happen at the same time, which eases the pain of Fibonacci logic, as evident in the line below used to find the next values in the sequence. 

```ruby
@smaller, @larger = @larger, @smaller + @larger
```

Also I added a little syntactic sugar with "self.up_to". I think it feels intuitive in the solution to the Project Euler problem:

```ruby
Fibonacci.up_to(4_000_000).select(&:even?).reduce(:+)
```

And how long does that take? 0.000062s on my machine.