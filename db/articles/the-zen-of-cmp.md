You are not allowed to overload operators in golang. Instead, custom structs need to implement desired math operators by name. 

When would you need to overload operators anyway? 

### Money Type

In financial software, you can use a money type to prevent combining different currencies. 

```go
package money

type Money struct {
    currency string
    amount int64
}

func (a Money) Add(b Money) Money {
    if a.currency != b.currency {
        panic("currency mismatch")
    }
    return Money{
        currency: a.currency,
        amount: a.amount + b.amount,
    }
}
```

*Clever idea, Mint.com?*

So you can add money. 

```go
func main() {
    a := Money{"USD", 1000}
    b := Money{"USD", 200}
    c := a.Add(b)
}
```

It works, but doesn't provide equality operators. 

```go
func main() {    
    a > b    // invalid operation: a > b (operator > not defined on struct)
}
```

### Write All The Ops?

First instinct is to write out each operator on the struct.

```go
func (a Money) Lte(b Money) bool {
    if a.currency != b.currency {
        panic("currency mismatch")
    }
    return a.amount <= b.amount
}

// .. Lt .. Gt .. Gte ..
```

It works, but it's repetitive. 

### Cmp

I noticed in the `math/big` package instead of implementing equality operators, big types implement a `Cmp` method that returns `1` when greater, `-1` when less, or `0` when equal. 

```go
func (a Money) Cmp(b Money) int {
    if a.currency != b.currency {
        panic("currency mismatch")
    }
    if a.amount > b.amount {
        return 1
    } else if a.amount < b.amount {
        return -1
    } else {
        return 0
    }
}
```

The `Cmp` operator lets you perform standard comparisons against zero. 

```go
func main() {
    if a.Cmp(b) >= 0 {
        // a >= b
    }
    if a.Cmp(b) == 0 {
        // a == b
    }
    if a.Cmp(b) < 0 {
        
    }
}
```

There's something zen about a function that reduces comparison information to a point where you can use standard operators again. 
