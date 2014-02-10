Benchmarking is the best way to compare the speed of code. However, ruby benchmarking (with the 'benchmark' gem) has verbose syntax for running code blocks multiple times for each test. This is useful for choosing between two ore more quick actions that have the same output but must be used over and over again in your program. 

It's pretty easy to build on top of 'benchmark' and create a very simple benchmarking interface. I wanted the syntax below. In this example, it compares ways of splitting a string into an array of characters. 

```ruby
benchmark 1.million.times do
  
  str = "a fairly long string but not too long"
  
  time "split quotes" do
    str.split('')
  end
  
  time "split regex" do
    str.split(//)
  end
 
  time "chars to_a" do
    str.chars.to_a
  end
      
end
```

And get the benchmark output of each timed test with a rehearsal. 

```
Rehearsal ------------------------------------------------
split quotes   0.220000   0.000000   0.220000 (  0.228510)
split regex    0.220000   0.000000   0.220000 (  0.225835)
chars to_a     0.220000   0.000000   0.220000 (  0.243870)
--------------------------------------- total: 0.660000sec

                   user     system      total        real
split quotes   0.200000   0.000000   0.200000 (  0.207176)
split regex    0.200000   0.000000   0.200000 (  0.203508)
chars to_a     0.200000   0.000000   0.200000 (  0.205274)
```

I'll walk through the steps to make the syntax above work. 

### Cool numbers

One of the more unnecessary parts of the above syntax is allowing numbers to have the hundred, million, billion, etc. methods. With a little meta-programming it's very concise though. 

```ruby
class Fixnum
  
  def hundred
    self * 100
  end
  
  [:thousand, :million, :billion].each_with_index do |name, i|
    define_method name do
      self * 10**(i.next * 3)
    end
  end
  
end
```

### Allowing .times

Definitely the most trivial part of the syntax is allowing a number or number.times. I think it reads well, so I wanted that to be a feature. 

The block is being passed to the benchmark method, not number.times, so basically we need to return the number when passed a number, and the amount of entries in the Enumerator when passed number.times. 

Also, it is a good idea to wrap related logic in a module to avoid polluting the namespace (although that's not a huge deal with one-off benchmarks) and also just to keep related methods together.

```ruby
module EasyBenchmark

  def self.iterations_given(amount)
    if amount.respond_to? :count
      amount.count
    else
      amount
    end
  end

end
```

### Building on top of benchmark

Logical groups of methods should be collected. Benchmarking is not really an object that needs instances, so I put it in a module. 

```ruby
module EasyBenchmark
  # the rest of the code in here
end
```

The reason for all of this is to specify an amount of iterations to be performed on each code block. To do that, each test in benchmark needs to be wrapped in a looping mechanism. This can be done be iterating over a collection of objects each containing the label of the code being timed and the code block to be timed. 

```ruby
TimeTest = Struct.new :label, :method
```

Next, to collect these TimeTest structs in an array each time :time is called in the benchmark block, we'll need an array. A module variable holding onto it makes sense to me. It doesn't exist yet, but it'll be called @tests. 

```ruby
def time(label, &method)
  t = TimeTest.new label.to_s, method
  @tests.push t
end
```

Note the block itself is given to the TimeTest as an instance variable. It is a Proc and it can then be called in the benchmark method. 

The 'benchmark' gem has many methods and formatting options, but I just wanted Benchmark#bmbm to do a rehearsal and then a test, and format it to 7 spaces. I figured a reasonable default for iterations was 100. 

```ruby
def benchmark(iterations = 100, &tests)
  @tests = []
  tests.call
  iterations = EasyBenchmark.iterations_given(iterations)
  Benchmark.bmbm(7) do |x|
    @tests.each do |test|
      x.report(test.label) do
        iterations.times { test.method }
      end
    end
  end
end
```

In hindsight, it's a little confusing with two different 'tests', so recognize the difference between &tests, tests (the block passed int) and @tests (the empty array). 

When the &tests block is called, :time is called multiple times which fills @tests with TimeTest objects. 

Then the iterations are set so that the 5.times Enumerator will be converted to 5 if that syntax was used. 

Finally for each test, a new report is added to the Benchmark.bmbm call wrapped in a loop that will iterate the desired amount of times. 

### Github

Check out the [source code on github](https://github.com/aj0strow/easy-benchmark) which includes an example. 

I'd just like to end with a reminder not to prematurely optimize code. You should look for magnitude differences, like 2x slower, 5x slower, etc. 

If the difference is trivial when repeated millions of times, it won't really matter. If you do it 100 times and 1000 times, and the difference remains constant, again its not a huge deal. If it does matter, write it in C. 