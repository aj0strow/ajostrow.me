I learned how to deployed a static site with encryption today. I had to edit configuration files on the remote machine, and the perfect tool was `rmate`. It's the companion script to [TextMate 2](http://macromates.com/download) that lets you open remote files in a local editor window. 

TextMate blocks rmate connections by default. Enable via preferences.

```
TextMate > Preferences > Terminal

  ✓ Accept rmate connections.
    Access for: (local clients)
          Port: 52698
```

### Install Script

You need to install `rmate` on the remote machine. I'm using the placehoder `1.1.1.1` to mean the IPv4 address of the remote machine. 

```
$ ssh root@1.1.1.1
~# apt update
~# apt install ruby
~# gem install rmate
```

If you bind the remote port, you can `rmate` files to edit in TextMate on your local machine.

```
$ ssh -R 52698:localhost:52698 root@1.1.1.1
~# rmate .bashrc
```

It should pop open the remote `.bashrc` into a local editor window. If you save the file, it saves on the remote machine.

### SSH Config

I forward the port for every host. I haven't looked into security concerns so use at your own risk. Add port forwarding for `rmate` to `~/.ssh/config`. 

```
# rmate port forwarding.
RemoteForward 52698 localhost:52698 
```

It should work now without the -R flag.

```
$ ssh root@1.1.1.1
~# rmate .bashrc
```

The end result is `mate` when the file is local and `rmate` when remote. 
