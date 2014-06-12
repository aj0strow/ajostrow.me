Digital Ocean is a cheap cloud provider aimed at developers. The idea is simplified snapshots and redeployments via rest api. Create an accout, enter your credit card, take down your api keys, and then we can use the cli. 

```
$ gem install tugboat
```

The [tugboat documentation](https://github.com/pearkes/tugboat) suggests using the `authorize` command, but the tty interface is out of date, so edit the information directly.

### Configure

```
$ touch ~/.tugboat
```

Edit `~/.tugboat` with the following. 

```
---
authentication:
  client_key: ********************************
  api_key: ********************************
ssh:
  ssh_user: root
  ssh_key_path: ~/.ssh/id_rsa
  ssh_port: 22
defaults:
  region: 4
  image: 3101918
  size: 66
  ssh_key: ######
  private_networking: false
  backups_enabled: false
```

Digital Ocean works with numeric ids, not string identifiers. So each setting under `defaults` needs to correspond to the id, such as 4 above for the New York 2 region. You can get ids with information commands. 

Choose a default region, image, size, and ssh key for default settings.

```
$ tugboat regions
$ tugboat images --global
$ tugboat sizes
$ tugboat keys
```

If you don't have any ssh keys on Digital Ocean, add one.

```
$ tugboat help add-key
$ tugboat add-key aj0strow -p ~/.ssh/id_rsa.pub
```

Then list keys again and add the id to the configuration. If you skip this step, Digital Ocean will email you root credentials which is no good. 

### Deploy

To deploy an instance, choose a name.

```
$ tugboat create deploy-test
```

You can see all droplets and get info as well.

```
$ tugboat droplets
deploy-test (ip: ###.###.###.###, status: active, region: 4, id: #######)

$ tugboat info deploy-test
Droplet fuzzy name provided. Finding droplet ID...done, ####### (deploy-test)

Name:             deploy-test
ID:               #######
Status:           active
IP:               ###.###.###.###
Region ID:        4
Image ID:         3101918
Size ID:          66
Backups Active:   false
```

Ping the IP and you should get bytes back.

```
$ ping ###.###.###.### -c 1
```

### SSH

You can ssh into the instance using a fuzzy name. 

```
$ tugboat ssh deploy
Executing SSH (deploy-test)...
root@deploy-test:~# 
```

Then install stuff you want. Most necessities are apt-get packages. 

```
~# apt-get update
~# apt-get install redis-server --yes
~# redis-cli ping
PONG
```

Once you're familiar, destroy the test deployment and make a real one. It costs $0.007 to create and destroy a droplet, so mistakes are fine. 

```
~# exit
$ tugboat destroy test
```

### Nodejs Example

Here's a quick example of how to deploy a Nodejs app. Same steps as before.

```
$ tugboat create web-01
$ tugboat ssh web-01
~# apt-get update
```

First install node. 

```
~# apt-get install nodejs --yes
~# apt-get install npm --yes
```

Install forever. Symlink `nodejs` to `node`, so that `forever` can find it first tho. 

```
~# ln /usr/bin/nodejs /usr/bin/node
~# npm install -g forever
```

Fetch and install the app. 

```
~# mkdir -p /var/apps
~# apt-get install git --yes
~# git clone http://github.com/user/reponame /var/apps/reponame
~# cd /var/apps/reponame
~# npm install
```

Run the app on port 80 to play nice with load-balanced A-records. 

```
~# export PORT=80
~# forever start index.js
~# exit
```

If all went well, the app should be available at the ip address. 

```
curl ###.###.###.###
```

### DNS

If you're using dokku or something fancy, you need a root domain name to allow subdomains. Otherwise it's fine to use an A-record to point a subdomain to the ip address of the droplet. 

```
www.domain.com.   A   ###.###.###.###
```

If your dns provider allows for load-balanced record sets, you can point the domain to multiple droplets.

```
www.domain.com.   A   ###.###.###.###
                      ###.###.###.###
```

### Multiple Accounts

If you want to host apps on different credit cards (for different clients) the easiest way I've found is to keep multiple tugboat configs, and copy the one you want to use.

```
$ cp ~/.company1.tugboat ~/.tugboat
$ tugboat droplets
$ cp ~/.company2.tugboat ~/.tugboat
$ tugboat droplets
```

If any of this was unclear or breaks on you, tweet [@aj0strow](https://twitter.com/aj0strow). 
