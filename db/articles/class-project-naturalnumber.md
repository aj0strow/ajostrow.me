### The Assignment

I just turned in my first computer science assignment of university, and the goal was to implement the 4 elementary operations (addition, subtraction, multiplication, division) in Java for a NaturalNumber. A NaturalNumber (code below) is basically just a base and a list of digits from least significant to most significant. 

```java
// NaturalNumber.java

import java.util.LinkedList;

public class NaturalNumber  {
	
    int base;       
    private LinkedList<Integer> coefficients;

    NaturalNumber(int base, int[] intarray) throws Exception {
        this.base = base;
        coefficients = new LinkedList<Integer>();
        for (int i=0; i < intarray.length; i++) {
            if ( (intarray[i] >= 0) && (intarray[i] < base) )
                coefficients.addFirst( intarray[i] );
            else {
                throw new Exception("Invalid coefficient");
            }
        }
    }

    NaturalNumber(int base) {
        this.base = base;
        coefficients = new LinkedList<Integer>();
    }

    public int compareTo(NaturalNumber second) {
        int diff = this.coefficients.size() - second.coefficients.size();
        if (diff != 0) return diff / Math.abs(diff);
        for(int i=this.coefficients.size() - 1; i >= 0; i--) {
            diff = this.coefficients.get(i) - second.coefficients.get(i);
            if (diff != 0) return diff / Math.abs(diff);
        }
        // They are equal if the program reaches here.
        return 0;
    }

    public NaturalNumber clone() {
        NaturalNumber copy = new NaturalNumber(this.base);
        for (int i=0; i < this.coefficients.size(); i++)
            copy.coefficients.addLast( new Integer( this.coefficients.get(i) ) );
        return copy;
    }

    public String toString() {	
        LinkedList<Integer> reverseCoefficients = new LinkedList<Integer>();
        for (int i=0;  i < coefficients.size(); i++)
            reverseCoefficients.addFirst( coefficients.get(i) );
        return reverseCoefficients.toString();		
    }
}

```

The idea is that each of the 4 basic operations can be performed with the same algorithm in any base. For example, adding in octal is the same process as adding in hex or binary. 

Coding the basic operations was actually a fantastic exercise and I urge you to try your hand at each method. I'll post my answer to each too so you can compare. Make sure to test it with multiple bases and values. 

One last note: NaturalNumber land is magical, and thus NaturalNumbers are always positive, the NaturalNumber passed in always has the same base, and NaturalNumbers never have any leading zeroes. 

The methods are as follows:

```java
public NaturalNumber add (NaturalNumber second) { }
public NaturalNumber subtract (NaturalNumber second) { }
public NaturalNumber multiply (NaturalNumber second) { }
public NaturalNumber divide (NaturalNumber second) { }
```

### add

The first operation to solve was addition. The method is simple enough- add each corresponding coefficient and carry the extra. If there isn't a value, just take the lone value just like grade-school addition. 

```java
//...

public NaturalNumber add(NaturalNumber second) {
		
    NaturalNumber sum = new NaturalNumber( this.base );
		
    int carryOver = 0;
		
    int largestSize = Math.max( this.coefficients.size(),
                         second.coefficients.size() );
    for (int i=0; i < largestSize; i++) {
        int sumOfCoefficients = carryOver;
			
        // Need to check each index is in bounds or get(i) will throw
        // an exception if the lists are different sizes. 
			
        if (i < this.coefficients.size())   
            sumOfCoefficients += this.coefficients.get(i);
        if (i < second.coefficients.size()) 
            sumOfCoefficients += second.coefficients.get(i);
			
        carryOver = sumOfCoefficients / this.base;			
        sum.coefficients.add( sumOfCoefficients % this.base );
    }
    if (carryOver > 0) 
        sum.coefficients.add( carryOver );
    return sum;		
}

//...
```

### subtract

Remember, larger numbers must subtract smaller numbers and not vice versa, as there are no negatives in NaturalNumber world. Now for the subtract method!

```java
//   a.subtract(b) where a>b. If a<b, then it throws an exception.
	
public NaturalNumber subtract(NaturalNumber second) throws Exception {
		
    // Exception handling done in a wrapper method
		
    if (this.compareTo(second) < 0) {
        throw new Exception("subtract a - b requires that a > b");
    } else {
        // The subtract method modifies the coefficients in place, so we'll
        // work with a duplicate instead. 
			
        return this.clone().validlySubtract(second);
    }  			
}
	
private NaturalNumber validlySubtract(NaturalNumber second) {

    NaturalNumber difference = new NaturalNumber(this.base);

    for (int i=0; i < this.coefficients.size(); i++) {
        int nextCoefficient = this.coefficients.get(i);
        if (i < second.coefficients.size() )
            nextCoefficient -= second.coefficients.get(i);

        // If negative, borrow from the next digit place
			
        if (nextCoefficient < 0) {
            this.coefficients.set( i+1, this.coefficients.get(i+1) - 1 );
            nextCoefficient += this.base;
        }
        difference.coefficients.add( nextCoefficient );
    }
    return difference;
} 
```

### multiply

Multiplication and division especially are a little trickier. The worst method is obviously if you were multiplying x * y to add x together y times. Far too slow. Instead I did the same method as elementary school long multiplication: multiply each digit of one factor by each digit of the other factor. 

```java
public NaturalNumber multiply(NaturalNumber second) {

    NaturalNumber product = new NaturalNumber( this.base );

    for (int multiplierIndex=0; multiplierIndex < second.coefficients.size();
             multiplierIndex++) {
			
        int multiplier = second.coefficients.get( multiplierIndex );
        int carryOver = 0;

        for (int i=0; i < this.coefficients.size(); i++) {
				
            // The product index dictates what digit place (what power) 
            // the value applies to. 
				
            int productIndex = multiplierIndex + i;
            int multiplicand = this.coefficients.get(i);
				
            // Appending an implied zero for no value reduces the conditionals
            // needed to avoid exceptions from accessing nonexistent nodes
								
            if (product.coefficients.size() <= productIndex) 
                product.coefficients.add( 0 );
				
            int currentValue = product.coefficients.get(productIndex);
            int value = multiplier * multiplicand + carryOver + currentValue;

            carryOver = value / this.base;
            product.coefficients.set(productIndex, value % this.base);
        }
        if (carryOver > 0) product.coefficients.add( carryOver );
    }
    return product;
}
```

### divide

Last but certainly not least was division. Remember back to 2nd or 3rd grade math class when the teacher introduced long division and half the class decided it was too hard and therefore they didn't like math. Well it actually is a little trickier than the other operations. 

I used a method where I borrow down until I have a clean divide. This may not be the fastest way though, but it was the first one I got working and passing tests. My friend Jake had another method where he guessed how many times the number would go into the first x amount of digits, and then modified that guess until he was right. Anyway here's the code to my solution below.

```java
// It is assumed there are no leading zeroes in either Natural Number
// if there are, make a method to remove them.

public NaturalNumber divide(NaturalNumber second) throws Exception {
    if ( second.isZero() ) {
        // The same exception BigInteger throws for x / 0
        throw new ArithmeticException("NaturalNumber divide by zero");
    }
    return this.clone().validlyDivide( second.clone() );
}

public boolean isZero() {
    for (Integer i : coefficients) {
        if (i > 0) return false;
    }
    return true;
}

private NaturalNumber validlyDivide(NaturalNumber divisor) {
    NaturalNumber quotient = new NaturalNumber(this.base);
		
    // In case 'divisor' has more coefficients than 'this'
    quotient.coefficients.add(0);
		
    while (this.coefficients.size() >= divisor.coefficients.size()) {
        if ( this.correspondingCoefficientsSmallerThan(divisor) ) {
            quotient.coefficients.addFirst( 0 );
            this.borrowMostSignificantValue();
        } else {
            this.prepareToDivide(divisor);
            quotient.coefficients.addFirst( this.partiallyDivide(divisor) );
        }
    }		
    return quotient;
}

private boolean correspondingCoefficientsSmallerThan(NaturalNumber divisor) {
		
    for (int i = this.coefficients.size()-1, j = divisor.coefficients.size()-1; 
                 j >= 0; i--, j--) {
        if( this.coefficients.get(i) > divisor.coefficients.get(j) )
            return false;
        else if ( this.coefficients.get(i) < divisor.coefficients.get(j) )
            return true;
    }
    return false;
}

private void borrowMostSignificantValue() {
    if (this.coefficients.size() > 1) {
        int value = this.coefficients.removeLast();
        this.addToCoefficient(this.coefficients.size()-1, value * this.base);
    }
}

// Where all of the borrowing takes place

private void prepareToDivide(NaturalNumber divisor) {
    int target = 1;
    for (int i = this.coefficients.size()-1, j = divisor.coefficients.size()-1; 
               j >= 0; i--, j--) {
			
        // Check value to avoid x / 0 error
			
        if( divisor.coefficients.get(j) > 0 ) {
            int partialQuotient = this.coefficients.get(i) / 
                                            divisor.coefficients.get(j);
            if(partialQuotient < target) {
					
                // Borrow from more significant coefficient once
					
                this.addToCoefficient(i, this.base);
                this.addToCoefficient(i + 1, -1);
					
                // Start loop over again
					
                i = this.coefficients.size(), j = divisor.coefficients.size();
                target = 1;
            } else {
                target = partialQuotient;
            }
        }
    }
}

private int partiallyDivide(NaturalNumber divisor) {
    int comparison = this.compareTo(divisor);
    if(comparison <= 0) {
        this.coefficients.clear();
			
        // If comparison is -1, aka <, quotient should be 0
        // If comparison is 0, aka ==, quotient should be 1
        return comparison + 1;
    }
		
    int quotient = this.coefficients.getLast() / divisor.coefficients.getLast();
		
    // Loop from most significant coefficient to the last corresponding 
    // coefficient and subtract the dividend amount like in long division. 
		
    for(int i=1; i <= divisor.coefficients.size(); i++) {
        int index = this.coefficients.size() - i;
        int intDivisor = divisor.coefficients.get(
                 divisor.coefficients.size() - i );
        this.addToCoefficient(index, -intDivisor * quotient);
    }
		
    // Borrow down now that the largest value has been divided
		
    this.borrowMostSignificantValue();
				
    return mostSignificantCoefficientQuotient;
}

private void addToCoefficient(int index, int amount) {
    this.coefficients.set(index, this.coefficients.get(index) + amount);
}
```

And there we go. As I said, probably not the most elegant approach lines-of-code-wise, but it got the job done. 

### wrap-up

The assignment was not particularly difficult, but it reminded me of some key points in Java programming, some of which are applicable in other languages too:

* Always define variables in the narrowest scope you can. 
* Handle exceptions in a separate method.
* LinkedList implements the List<T> interface and is more suitable for problems needing a lot of adding and removing of elements. ArrayList is probably better for lots of reads but certainly not adding and removing from the front. 
* Test-drive everything. Every single function. I was caught up with the division method for a while because one of the helper methods was not doing what it should. 
* Use helper methods to aid readability. 

I hope that was interesting, and feel free to post your solutions below!