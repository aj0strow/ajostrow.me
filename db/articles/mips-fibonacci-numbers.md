"Quick! Print out the first 10 fibonacci numbers, but-"

No problem. Just bang this one out in C, and with a little luck...

```c
#include <stdio.h>

int fibonacci(int n);

int main(int argc, char **argv)
{
   puts("First 10 fibonacci numbers:");
   int i, fib;
   for(i=0; i<10; i++) {
      fib = fibonacci(i);
      printf("%d, ", fib);
   }
   puts("");

   return 0;
}

int fibonacci(int n) {
   if (n <= 1) return n;
   return fibonacci(n-1) + fibonacci(n-2);
}
```

... it works:

```
First 10 fibonacci numbers:
0, 1, 1, 2, 3, 5, 8, 13, 21, 34,
```

### "But write it in MIPS assembly!"

Oh. Well this one takes some thought now.

The first issue is that MIPS Assembly language doesn't have great printing mechanisms, all variables are global, and the list goes on. First registers need to be reserved. We'll use $t0 for the input, and $t1 for the output. 

Some things to remember. To print something, we need to assign the right data interpretation scheme to $v0 (1 for ints, 4 for strings), put the value in $a0, and then instruct a syscall. Also, the whole jumps and labels thing. 

A note on indentation: it is standard to have no indentation for assembly code. I like Ruby indentation (2 spaces) so I use that for my assembly too. 

### Organization in psuedo code

Here's how it'll work. Main will print the description, loop through $t0 values 0 until 10, and print out the corresponding fibonacci number. 

We'll want labelled instruction sets for storing fibonacci($t0) in $t1, and printing the output.

```
# psuedo code

main()
   print description
   
   for $0 = 0 -> 9
      fibonacci()
      print()
   exit program

fibonacci()
   stack.push($0)
   $1 = 0
   
   subroutine
      if stack is empty, return control to main()
      temp = stack.pop()

      if temp <= 1
         $0 += temp
      else
         stack.push(temp-1)
         stack.push(temp-2)
      repeat subroutine

print_output()
   print $0
   print delim
   return control to main()

delim = ", "
description = "First 10 Fibonacci numbers\n"
``` 

It's apparent how the C code above is equivalent to the plan for the assembly program. 

### Main method

Main will print the description, and then loop through $t0 values calculating the fibonacci method and printing it. 

```
# Print first 10 Fibonacci numbers

main:

  # print description

  li $v0, 4               
  la $a0, description
  syscall
  
  # loop from $t0 = 0 until 10

  move $t0, $0     
  loop: beq $t0, 10, exit
  
    jal fibonacci
    jal print_output
    
  addi $t0, $t0, 1
  j loop

exit:
li $v0, 10
syscall

# fibonacci and print_output go here

.data
description: .asciiz "First 10 Fibonacci numbers:\n"
delim: .asciiz ", "
```

### Printing

Handling printing of the output is fairly simple. Just assign $1 and then the delimiter. 

```
print_output:
  li $v0, 1
  move $a0, $t1
  syscall
  
  li $v0, 4
  la $a0, delim
  syscall
jr $31
```

### Using a stack

The fibonacci() method is recursive. Unfortunately recursion doesn't really work with global variables. Instead, we'll need to push each call on a stack. 

Here's how to use the stack. To push on the stack do the following:

```
# decrement $sp by 4
addi $sp, $sp, -4
# store word to 0($sp)
sw $t0, 0($sp)
``` 

And to pop off the top element of the stack:

```
# load word from top of stack
lw $t1, 0($sp)
# increment $sp by 4
addi $sp, $sp, 4
```

Remember that the stack is upside-down, meaning that it starts at the largest available address, and counts down to 0. When it gets to 0, there is no more space on the call stack. You must increment and decrement it by 4 because the size of each 'word' is 32 bits or 4 bytes, hence the 4. 

### Fibonacci (recursive)

Finally the fibonacci method itself.

```
fibonacci:
  
  move $t1, $0
  move $t2, $sp
  li $t3, 1
    addi $sp, $sp, -4           # push initial $t0 on stack
  sw $t0, 0($sp)
  
  recursive_call:
    beq $sp, $t2, fib_exit       # if stack is empty, exit
  
    lw $t4, 0($sp)               # pop next $t4 off stack
    addi $sp, $sp, 4
    
    bleu $t4, $t3, early_return
    
      sub $t4, $t4, 1            # push $t4 - 1 on stack
      addi $sp, $sp, -4
      sw $t4, 0($sp)
      
      sub $t4, $t4, 1            # push $t4 - 2 on stack
      addi $sp, $sp, -4
      sw $t4, 0($sp)
      
      j recursive_call
      
    early_return:
    
      add $t1, $t1, $t4
      j recursive_call
      
  fib_exit:
jr $31
```

And the output, when run in a program like SPIM (an emulator for MIPS Assembly), gives the following:

```
First 10 fibonacci numbers:
0, 1, 1, 2, 3, 5, 8, 13, 21, 34,
```

That's just one way to do it. I'm sure there are many other methods, and certainly better ones. 