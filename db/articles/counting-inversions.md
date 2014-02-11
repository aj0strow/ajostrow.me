I was reading section 5.3 of *Algorithm Design* by Kleinberg and Tardos, and I wondered just how much faster it would be on relatively small inputs. 

### Uh, Counting Inversions?

Counting inversions has practical applications in suggesting content to users based on other user choices who have similar tastes (think Netflix). Quantifying how similar two users' tastes are then becomes the challenge. One way to rank comparisons is to assign each item a ranking based on user 1's preference order, and then put those rankings in the order of user 2's preferences. Then see how many are out of order.

For example, suppose user 1 likes Grey's Anatomy, The Walking Dead, Supernatural, Breaking Bad, Criminal Minds in that order, and user 2 likes The Walking Dead, Breaking Bad, Grey's Anatomy, Supernatural, Criminal Minds in that order. 

If we assign each TV show a number based on user 1's ordering, aka Grey's Anatomy -> 1, etc we get [1, 2, 3, 4, 5]. Now, with reference to user 1's preferences, user 2's preferences are like so: [2, 4, 1, 3, 5]. We can then count the inversions, or each time a less preferred show appears before a more preferred show, as follows (2, 1), (4, 1), (4, 3) for a total inversions count of 3. 

### Brute Force

The brute force method for counting inversions is to take each rank one at a time, and check it against each rank' of a higher index in the list, incrementing the total count each time rank > rank'. 

```ruby
def brute_force_count(ranks)
  total, n = 0, ranks.count
  ranks.each_with_index do |rank, ind|
    (ind...n).each { |i| total += 1 if rank > ranks[i] }
  end
  total
end
```

If the size is n, the iteration for the first element takes (n-1) comparisons, the second iteration takes (n-2) comparisons, etc until the last requires 0. The summation comes out to O( n&#94;2 ) time. 

### Divide and Conquer

The better approach splits the list in 2 equal parts recursively, and returns the lists joined together sorted along with the inversions count. The clever part of the algorithm is that it can add many inversions at once without checking them all. If you have a sorted array [4, 5, 6], and a lower rank (say 2), if 2 is less than 4, it is less than each of [4, 5, 6] by definition of "sorted". 

Now imagine if each time we split the array of preferences into a more preferred half, and a less preferred half. We then combine them by taking the smaller of the first elements of the lists. If the smaller is from the less preferred half, we know to add the count of the more preferred elements, as it must be smaller. For example:

```
Should be 2 inversions:

pref_more: [1, 4], pref_less: [2, 3], sorted: [], count: 0
pref_more: [4], pref_less: [2, 3], sorted: [1], count: 0
pref_more: [4], pref_less: [3], sorted: [1, 2], count: 1
pref_more: [4], pref_less: [], sorted: [1, 2, 3], count: 2

sorted: [1, 2, 3, 4], count: 2
```

Recursive calls are made until it is divided into 1-element lists, and then merged back together (like merge-sort), so we will only ever deal with sorted lists. 

```ruby
def sort_and_count(ranks)
  n = ranks.count
  return [ 0, ranks ] if n <= 1
  
  count_a, a = sort_and_count ranks[0...n/2]
  count_b, b = sort_and_count ranks[n/2..-1]  
  count, sorteds = merge_and_count(a, b)
  [ count + count_a + count_b, sorteds ]
end

def merge_and_count(a, b)
  total, sorteds = 0, []
  while a.any? and b.any?
    if a.first < b.first
      sorteds.push a.shift
    else
      total += a.count
      sorteds.push b.shift
    end
  end
  [ total, sorteds.push(*a, *b) ]
end

def sort_and_merge_count(ranks)
  sort_and_count(ranks).first
end
```

### Benchmark

So how much faster is it anyway? I used the following code, changing SIZE.

```ruby
require 'benchmark'

ranks = (1..SIZE).to_a.shuffle

Benchmark.bm do |x|
  x.report('Brute force:   ') { brute_force_count ranks.dup }
  x.report('Sort and merge:') { sort_and_merge_count ranks.dup }  
end
```

Here are the results. For 50, the brute force method is about 2x faster. And watching 50 movies on Netflix is a very reasonable number. 

```
Brute force:     0.000000   0.000000   0.000000 (  0.000307)
Sort and merge:  0.000000   0.000000   0.000000 (  0.000601)
```

For 500 movies, probably an upwards bound, using the divide and conquer method is over 2x faster. 

```
Brute force:     0.030000   0.000000   0.030000 (  0.024619)
Sort and merge:  0.010000   0.000000   0.010000 (  0.009028)
```

And for fun, just to prove that it does grow outrageously, for 10,000:

```
Brute force:     9.490000   0.010000   9.500000 (  9.553914)
Sort and merge:  0.230000   0.000000   0.230000 (  0.230728)
```

Probably not that helpful for Netflix, but certainly a better algorithm in worst-case!