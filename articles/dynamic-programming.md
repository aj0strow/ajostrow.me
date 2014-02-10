To memoize means to save the value of a computation so that it can be recalled instead of recalculated. It is especially useful in dynamic programming algorithms, where exponential problem spaces are reduced with recursive calls into simple problems.

A classic example is weighted interval scheduling. There is one conference hall and there are a variable amount of reservations at different times, for different durations. Who gets the hall? If you can assign a weight of importance to each interval, you can find an optimal solution. However, the solution requires a lot of recursive calls with the same arguments.

### Optimal Path Down a Triangle

In our example, I'll use a simpler problem: calculating the maximum path down a triangle. Note it can be solved with a greedy algorithm starting from the bottom, but bear with me, its a nice visual example.

```ruby
class Triangle
  def initialize(height)
    @height = height
    @rows = (1..height).map do |len|
      len.times.map{ rand(10) }
    end
  end
  
  def to_s
    rows = @rows.map.with_index do |row, i|
      ' ' * (@height - i.next) + row.join(' ') 
    end
    rows.join("\n") 
  end
  
  def max_path
    optimal_path(0, 0)
  end
  
  def optimal_path(row, index)
    value = @rows[row][index]
    if row == @height - 1
      [ value ]
    else
      left = optimal_path(row.next, index)
      right = optimal_path(row.next, index.next)
      optimal = [left, right].max_by{ |p| p.reduce(:+) }
      optimal.unshift(value)
    end
  end
end
```

So to see how it works here's a little console session:

```ruby
tri = Triangle.new(5)
puts tri
    0
   8 4
  1 2 3
 6 7 1 1
4 6 4 5 2
p tri.max_path
[0, 8, 2, 7, 6]
```

If we follow execution of the algorithm, we can see it starts by calling optimal_path(0, 0). This in turn will call optimal_path(1, 0) and optimal_path(1, 1). So far so good. The left side will recursively call for (2, 0) and (2, 1), while the right side will call for (2, 1) and (2, 2). And we reach our first redundancy: optimal_path(2, 1) is being called twice. 

The redundancy gets worse with taller triangles, as each element in the triangle calculates the optimal path of the subtriangle with it at the top. For example, the left and right recursive subtriangles after the first call on the left and right, respectively. 

```
              0     
   8         8 4         4
  1 2       1 2 3       2 3
 6 7 1     6 7 1 1     7 1 1
4 6 4 5   4 6 4 5 2   6 4 5 2
```

Benchmarking shows the slowdown:

```ruby
require 'benchmark'

[ 10, 15, 20 ].each do |height|
  puts Benchmark.measure{ Triangle.new(height).max_path }
end

  0.010000   0.000000   0.010000 (  0.002624)
  0.060000   0.000000   0.060000 (  0.059057)
  1.830000   0.000000   1.830000 (  1.829768)
```

It's growing exponentially.

### Memoization

The problem with the algorithm is that it recalculates the optimal path every time it hits a subtriangle, even if it's already seen that subtriangle before. If we saved the value in some global state, then we could calculate each optimal path for each subtriangle once. 

Here's a generalized memoization mixin, although I don't think the main @mem hash could prune the o_mem hashes once the object instance is garbage collected, so don't use it in a real script.

```ruby
module Memoization
  
  @mem = Hash.new do |mem, object_id|
    mem[object_id] = Hash.new do |o_mem, method_name|
      o_mem[method_name] = {}
    end
  end
  
  class << self    
    def included(base)      
      memoize = proc do |method_name|
        private_method = "__#{method_name}__"
        alias_method private_method, method_name
        private private_method
        define_method method_name do |*args|
          mem = Memoization.instance_variable_get('@mem')
          mem[object_id][method_name][args] ||= send(private_method, *args)
        end
      end
      
      base.class.send(:define_method, :memoize, memoize)
    end
  end
end
```

Basically, it overwrites the method on the object to check a memory store of passed values before it calculates. And to use it with Triangle:

```ruby
class Triangle
  include Memoization
  memoize :optimal_path
end
```

And now the same benchmark shows that the values are indeed being saved:

```ruby
  0.000000   0.000000   0.000000 (  0.000795)
  0.000000   0.000000   0.000000 (  0.001824)
  0.000000   0.000000   0.000000 (  0.003626)
```
