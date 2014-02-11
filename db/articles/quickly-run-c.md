Coming from interpreted languages (interactive prompts!) I've become accustomed to quickly checking syntax and expressions by just running them. 

Here's a 1-line script I've found useful for quickly running a program. Called "runc":

```
# runc

gcc $1.c -o $1 && (./$1 "${@:2}"; rm $1)
```

It compiles, runs, and cleans a single file passed as an argument. Make it executable:

```
$ chmod +x runc
```

Then a C file called "test.c" in the same directory can be run with:

```
$ ./runc test
```

## Explaination

First, gcc is the GNU C Compiler command, which can take filenames, and an output name. The -o flag is used to specify the output name, otherwise it will compile to a.out. 

```
$ gcc test.c -o test
```

The $# accesses command line arguments, so $1 is the first argument (the c file name).

```
$ runc test    # $1 == "test"
```

&& is sort of like a command logical *and* meaning if the command to the left exits successfully (returning 0) then run the next command. 

```
$ first_program_succeeds && second_command_runs
$ first_program_fails && second_command_never_runs
```

The next part is grouped with parentheses to work with the && logic. If gcc compilation fails, there is no point in running and cleaning. 

The ./$1 runs the command that was named $1 in the -o option flag of gcc. So test.c would be compiled to an executable program "test", which can be run by ./test. 

The program is passed all remaining arguments. This is done with the range selector of the arguments. $0 is runc, $1 is test (the c filename) so $2, $3 .. $n should be passed to the compiled program. 

```
$ runc test arg1 arg2   # "${@:2}" == "arg1 arg2"
```

Then finally the compiled file is removed after it is run. The semicolon is used instead of && because the compiled file should be removed regardless of if the program ran successfully or not. It can always be compiled and run again. 
