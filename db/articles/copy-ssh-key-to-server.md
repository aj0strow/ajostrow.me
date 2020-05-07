Standard tools like `ssh-copy-id` assume that you have password access to the remote server. In my experience what usually happens is one developer creates the virtual server with a public key and then sometime later a new developer wants key-based access too. 

Here is the command to copy the other developer's key to the shared user account. 

```sh
cat ~/Downloads/<filename>.pub | ssh <user>@<hostname> 'cat >> ~/.ssh/authorized_keys'
```

Here is the command to remove the other developer's key. 

```sh
ssh <user>@<hostname> "sed -i.bak '/<regexp>/d' ~/.ssh/authorized_keys"
```
