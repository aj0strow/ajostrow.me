I started reading [The Drunkard's Walk](http://www.amazon.com/The-Drunkards-Walk-Randomness-Rules/dp/0307275175) and it struck me like lightning -- I maybe shouldn't generate short ids randomly. 

### Random Short Ids

The idea is to generate a reasonably short *unique* alphanumeric string before creating each new record. It's much easier to reason about `site.co/n8V34` than whole mongo ids like `site.co/537d11c63437320002010000`. 

The psuedocode was as follows.

```
id = generate_new_id()
while id_already_exists(id)
  id = generate_new_id()
end
```

There are `26 + 26 + 10` alphanumeric characters, or about 60. With only 2 characters we could accomodate over 3600 records and worry about it later. Right?

(All of the following code is in [Julia](http://julialang.org/).)

### Birthday Problem

The [Birthday Problem](http://en.wikipedia.org/wiki/Birthday_problem) is well-known and the premise is: How many people need enter a room until two people share the same birthday? Assume date of birth is random and ignore leap years. There are 365 days, so obviously if there are 366 people, two *must* share the same birthday. 100% probability. Beyond that we need probability theory. 

The first person is first, so there's a (0 / 365) chance she has the same birthday as another. The second person has a (1 / 365) chance of having the same birthday as the first person. The third a (2 / 365) chance of sharing with either the first or second person. We add the probabilities because any would be a winning condition. 

```julia
sum(map(x -> x / 365.0, 1:365))  # 183.0%
```

Well fuck we're over 100% for the last person. Something went wrong! The problem is that this violates the principle of the *sample space*. Every possibility must be considered. The first person's exact birthday is counter-intuitively important. 

For example, if the first birthday is Jan 1, the probability of the second birthday also being Jan 1 is `(1 / 365) * (1 / 365) = (1 / 365^2)`. The problem is that the probability of the first birthday being Jan 1 and the second being Jan 2 is also `(1 / 365^2)`. Now, the probability of the first being Jan 1, the second being Jan 2, and the third being Jan 1 is `(1 / 365^3)`. However that's only one winning combination considering person 3. It gets complicated. 

```julia
npermutations(x) = permutations(365, x) |> it -> size(collect(it), 1)
probability(n) = ((365 ^ n) - npermutations(n)) / (365 ^ n)

probability(2)     # ~0.3%
probability(3)     # ~0.8%
probability(365)   # ~100.0%
```

Now the 365th person has a 100% probability. Much better. If you try some of the middle terms tho you might break your computer.

### Birthday Solution

A better way to solve the problem is to calculate the probability there isn't a special birthday pair. The first person enters the room with a (365 / 365) chance there are no matches. The second person has a (364 / 365) chance there remain no matches. The third person walks in with a (363 / 365) chance. 

```julia
probability(n) = map(x -> (365 - x) / 365, 1:(n - 1)) |> xs -> reduce(*, xs)

1 - probability(2)    # ~0.3%
1 - probability(3)    # ~0.8%
1 - probability(365)  # ~100.0%
```

Simple enough. Double-check with experimental data? Why not.

### Graph Experiment

Install [Gadfly](https://github.com/dcjones/Gadfly.jl), the Julia charting library.

```sh
$ julia -e 'Pkg.add("Gadfly")'
```

To simulate the birthday problem we add a random number from 1 to 365 representing one day to a set. If the number's already in the set, two people share the same birthday and we return the count.

```julia
using Gadfly

const days = 365
const runs = 1000

function runsim()
  birthdays = Set()
  while true
    birthday = rand(1:days)
    if birthday in birthdays
      return length(birthdays) + 1
    end
    push!(birthdays, birthday)
  end
end

function runresults()
  results = Dict()
  for i = 1:runs
    result = runsim()
    results[result] = get(results, result, 0) + 1
  end
  results
end

results = runresults()
xs = sort(collect(keys(results)))
ys = map(x -> results[x], xs)
p = plot(x=xs, y=ys, Guide.xlabel("People"), Guide.ylabel("Frequency"))
draw(SVG("birthdays.svg", 1000px, 500px), p)
```

![](https://dl.dropboxusercontent.com/u/43880684/birthday_problem_1000.jpg)

Next we can compare the simulated distribution with the theoretical distribution.

```julia
# change runs
const runs = 100000

function prob(n)
  pct = map(x -> (365 - x) / 365, 1:(n - 1)) |> xs -> reduce(*, xs)
  int(floor((1 - pct) * runs))
end

function probresults()
  results = Dict()
  results[1] = 0
  for i = 2:days
    results[i] = prob(i)
  end

  # no double counting
  for i = days:-1:2
    results[i] -= results[i - 1]
  end
  results
end

sims = runresults()
xs = sort(collect(keys(sims)))
ys = map(x -> sims[x], xs)
actual = layer(x=xs, y=ys, Geom.point)

probs = probresults()
ys = map(x -> probs[x], xs)
theory = layer(x=xs, y=ys, Geom.line)

graph = plot(actual, theory, Guide.xlabel("People"), Guide.ylabel("Frequency"))
draw(SVG("graph.svg", 1000px, 500px), graph)
```

![](https://dl.dropboxusercontent.com/u/43880684/birthday_problem_100000.jpg)

Not bad at all.

### The Lesson

It doesn't take very many random walks to get a collision. The numbers for alphanumerics are pretty startling. With only 40 records the probability of a collision among the records is over 99%. 

So now you're probably thinking the algorithm in psuedocode at the beginning is flawed. Nope. There's nothing wrong with it. The Birthday Problem isn't a proper isomorphism. 

On the server, we don't care about all permutations. If the first token is `xF` then that token is taken. There is no alternate reality where the first token is `5j`. So there's a (0 / 3844) chance for the first token, and a (1 / 3844) chance for the second token, etc. An anology would be how many people does it take to find someone in a room with *your* birthday. About half. That said, it's always better to use a deterministic algorithm like the wonderful [hashids project](http://www.hashids.org/).

 Tweet [@aj0strow](https://twitter.com/aj0strow) if I messed up somewhere.
