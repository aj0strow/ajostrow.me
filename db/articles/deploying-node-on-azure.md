Azure has a nice interface for cloud services, and contrary to popular belief you're not stuck with Windows 8 and SQL Server, you can have a proper Ubuntu VM. 

This article will walk you through how to get node installed on ubuntu with capistrano. 

### Provision A Virtual Machine

Go into your azure portal, and click on "Virtual Machines" from the left sidebar. 

![azure vms](https://fbcdn-sphotos-b-a.akamaihd.net/hphotos-ak-ash4/1394042_10152002933422269_673088520_n.jpg)

Click the big "+ New" at the bottom left. Navigate to "From Gallery". 

![azure vm menu](https://scontent-b-lga.xx.fbcdn.net/hphotos-prn2/1395991_10152002933322269_1805760510_n.jpg)

Choose the latest Ubuntu VM available:

![ubuntu vm](https://scontent-a-lga.xx.fbcdn.net/hphotos-prn2/1383136_10152002933212269_1371173998_n.jpg)

Finish by adding an SSH certificate or choosing a password. I went with a randomly generated username and password for simplicity. I like ruby, so here's how I make random strings:

```ruby
require 'securerandom'
SecureRandom.base64(16).delete('=+/')
# => "rAiRQKPgjvOx2D9JCEZ0Q"
```

### Capistrano

```
$ gem install capistrano
$ capify .
```

First we need to set up for the azure vm:

```ruby
# capfile

load 'deploy'

default_run_options[:pty] = true

set :application, 'app_name'
set :repository, 'git@github.com:github_username/app_name.git'
set :scm, 'git'
set :ssh_options, forward_agent: true
set :branch, 'master'

# remember our random strings?
set :user, 'Fjse9lfsqGLj6oEJ7rX6'
set :password, '0selIE8sI83YjGypXgWhRL6'
set :deploy_to, '/var/apps/app_name'
set :use_sudo, true

role :app, 'azure_subdomain.cloudapp.net'
```

Test it with:

```
$ cap invoke COMMAND="echo 'hello server'"
```

### Installing Dependencies

The first thing to realize is that the VM doesn't have any useful tools like git yet. We have some installing to do! Using apt-get it's not too hard though:

```ruby
# config/deploy/ubuntu.rb

namespace :ubuntu do
  namespace :install do
    def apt_get(command)
      sudo "apt-get --yes --force-yes #{command}"
    end
  
    desc 'install git and node for ubuntu'
    task :default do
      install.git
      install.node
    end
  
    task :git do
      apt_get 'update'
      apt_get 'install git-core'
    end
  
    task :node do
      apt_get 'update'
      apt_get 'install python-software-properties python g++ make'
      apt_get 'install nodejs'
    end
  end
end
```

And load it in your capfile:

```ruby
# capfile

load 'config/deploy/ubuntu'
```

Then you can install dependencies with:

```
$ cap ubuntu:install
```

### Folders and Permissions

The next step for capistrano is to setup for deployment:

```
$ cap deploy:setup
```

Azure will not let you do anything unless you sudo, but at the same time capistrano makes the files for the root account. You need to take ownership:

```
$ cap invoke COMMAND='sudo chown -R `whoami` /var/www/app-name'
```

### Deploying The App

I chose to run the app with [forever](https://github.com/nodejitsu/forever) instead of dealing with upstart scripts, etc. I also chose to install everything globally. Both exercises in simplicity. 

```ruby
# config/deploy/node

namespace :node do
  desc 'save npm packages globally'
  task :install do
    sudo "npm install -g --production --loglevel warn #{current_path}"
  end
	
  desc "start node application"
  task :start do
    sudo "NODE_ENV=production PORT=8080 forever start #{current_path}/server.js"
  end
	
  desc "stop node application"
  task :stop do
    sudo 'forever stopall; true'
  end

  desc "restart node application"
  task :restart do
    stop
    sleep 5
    start
  end
	
  task :status do
    sudo 'forever list'
  end
end
```

Include the tasks in the main capfile, and add callbacks for capistrano deploys:

```ruby
# capfile

load 'config/deploy/node'

after 'deploy:update', 'node:install', 'node:restart'
after 'deploy:rollback', 'node:restart'
```

Now deploying should be automatic:

```
$ cap deploy
```

### Add Endpoint on Azure

The last step to seeing something is to add an http endpoint to azure. Click on your virtual machine, and create a new http endpoint:

![azure endpoint](https://scontent-a-lga.xx.fbcdn.net/hphotos-frc3/1375268_10152002973932269_125652860_n.jpg)

Once it is ready, you should be able to view your app at port 8080. I'll go into load balancing in a future article!