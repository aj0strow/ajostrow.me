Software projects involve moving and transforming data. It usually goes by fast, but in some cases you need to copy a large dataset, or perform work on 100k+ records. In those cases, it works well to set up a script on a remote server, and let it run overnight. 

### Code Remote

In order to write a script on a remote server, the server itself will need access to internal services like the database. It will be different for every company, but there is usually a way to pass the session info in environment variables or in a file. 

Access the code repository by setting up [SSH agent forwarding](https://developer.github.com/v3/guides/using-ssh-agent-forwarding/) in your local SSH config. It will allow you to clone the repository or pull the latest version. 

Pushing and pulling changes to the script can be slow, so instead I will edit the code files directly on the remote server with **Visual Studio Code Remote - SSH** extension. It feels exactly like coding locally, so it should be quick to edit the script as needed. 

The next step is run the script overnight in a detached terminal session. 

### Terminal Multiplexer

Install [`tmux`](https://github.com/tmux/tmux/wiki). 

```
$ sudo apt install tmux
```

Start a new session providing a name using `-s` in order to target the session later. In the example below `etl` is the name for the session, which stands for [extract, transform, load](https://en.wikipedia.org/wiki/Extract,_transform,_load). 

```
$ tmux new -s etl
```

Practice detaching from the session by pressing `control` + `b` and then `d` for detach.

List current sessions. It should display the `etl` session you created in the output. 

```
$ tmux ls
```

Attach to the session. The command `a` stands for attach, and `-t` is used to target the session by name.

```
$ tmux a -t etl
```

Start the script that you want to run overnight. I always try to include a progress bar. I will also initially run the script on a few records to make sure the script works. 

```
$ ./script  # depends on your language or framework of choice
```

It's time to let it run. Detach from the session:

```
$ C-b d   # control + b, then d
```

And sign off:

```
$ exit
```

Confirm the script is still running. Sign in with `ssh`, attach to the session with `tmux`, see the progress bar ticking, and then detach, sign off. Enjoy some personal time, get some sleep, and let the computer work all night. 
