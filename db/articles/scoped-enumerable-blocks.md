When dealing with ruby arrays, I greatly prefer the symbol-to-proc syntax. For example, to preprocess some search terms:

```ruby
terms.map { |term| term.downcase }

# becomes

terms.map(&:downcase) 
```

Instead of typing the individual item name twice, the method is called on each item. This gets messy to impossible with more complex examples though.

```ruby
terms.map(&:string).map(&:downcase)
terms.map { |term| term.strip.gsub(/\s+/, ' ').downcase }
```

### Scoped Enumerables

Excluding hash enumeration and splatting via proc arity, the block in the enumerable often references only the item passed to the block. Enter scoped enumerables. 

```ruby
module Enumerable
  class Scoped
    def initialize enum
      @enum = enum
    end
    
    def method_missing name, *args, &block
      @enum.send name, *args do |item|
        item.instance_eval &block
      end
    end
  end

  def scoped
    Scoped.new self
  end
end
```

Now enumerable blocks may be scoped to the passed item.

```ruby
terms.scoped.map { strip.gsub(/\s+/, ' ').downcase }
```

To me it's much easier to read without the noise of the passed parameter in the block. 

### Supporting Hashes

When iterating over a hash, each key-value pair is passed as a length-2 array. For example:

```ruby
{ a: 'b' }.each { |pair| p pair }
# [ :a, "b" ] 
```

The array class can be monkey-patched to have nice accessors for pairs in hash enumerations. 

```ruby
class Array
  alias_method :key, :first
  alias_method :value, :last
end
```

Which translates especially well to scoped syntax.

```ruby
{ a: 'a', b: 'b' }.each do |pair|
  puts "#{pair.key.inspect} => #{pair.value.inspect}"
end

# becomes

{ a: 'a', b: 'b' }.scoped.each do
  puts "#{key.inspect} => #{value.inspect}"
end
```

Although I'm not utterly convinced it's better than using the block arity. 

```ruby
{ a: 'a', b: 'b' }.each do |key, value|
  puts "#{key.inspect} => #{value.inspect}"
end
```