The goal is to wrap an R machine-learning prediction model with a ruby web application, and interface between the two with temporary CSV files. 

First, we'll need both Ruby and R installed on Heroku. (So we need the cedar stack.) More about heroku stacks: https://devcenter.heroku.com/articles/stack

### Configure Heroku App

Create the application if you haven't. The -s option chooses the stack, and the -b chooses the buildpack. You don't need to specify the app-name. 

```
$ heroku create app-name -s cedar \
   -b https://github.com/ddollar/heroku-buildpack-multi.git
```

The application should be on the cedar stack. 

```
$ heroku stack
=== app-name Available Stacks
  bamboo-mri-1.9.2
  bamboo-ree-1.8.7
* cedar
```

You want to see the star to the left of "cedar", if it's not, you'll need to [follow the migrate to cedar instructions](https://devcenter.heroku.com/articles/cedar-migration).

The buildpack should be the multi buildpack.

```
$ heroku config:get BUILDPACK_URL
https://github.com/ddollar/heroku-buildpack-multi.git
```

Otherwise set it (copy/paste as it's cut off):

```
$ heroku config:set BUILDPACK_URL=https://github.com/ddollar/heroku-buildpack-multi.git
```

### Buildpacks

When Heroku compiles your application slug, it follows instructions in a buildpack. There are a number of default buildpacks for popular frameworks, but any git repository can be used. More on buildpacks: https://devcenter.heroku.com/articles/buildpacks

Add a .buildpacks file to the very root of your project folder with the following contents:

```
https://github.com/virtualstaticvoid/heroku-buildpack-r.git
https://github.com/heroku/heroku-buildpack-ruby.git
```

These are the R and Ruby buildpacks respectively. When you push your code to Heroku, it should just work and the runtimes should be accessible. 

### R Initializer

Also in the root of your project directory, put an init.r file that does all of your initialization. Mine for example installs some packages.

```
# init.r

install.packages("e1071")
install.packages("rpart")
```

### Configure Ruby App

Make sure you have all of the files necessary to run the ruby application. For example the Gemfile, config.ru, and Procfile. For a sinatra app they could look like:

```yaml
# Procfile

web: bundle exec rackup -p $PORT
```

```ruby
# config.ru

require './app'
run Sinatra::Application
```

```ruby
# Gemfile

source 'https://rubygems.org'
ruby '1.9.3'

gem 'thin'
gem 'sinatra'
```

When you're all ready, commit and push the heroku application.

### Verifiy Slug Compilation

During the Heroku push, look at the output, specifically for the following lines:

```
-----> Multipack app detected

...

=====> Detected Framework: R

...

       R 2.15.1 successfully installed

...

=====> Detected Framework: Ruby/Rack

...

-----> Launching... done, v#
```

### Configure Path

Double-check where your ruby bundle is vendored to, in my case 1.9.1. It's likely not the same as your ruby version, so run the command:

```
$ heroku run ls vendor/bundle/ruby
1.9.1
```

And check where the R executable is located:

```
$ heroku run find -type f -name R
./vendor/R/lib64/R/bin/R
./vendor/R/lib64/R/bin/exec/R
./vendor/R/bin/R
```

Finally, add R and Rscript to the PATH (copy/paste as it's cut off):

```
$ heroku config:set PATH=vendor/R/bin:vendor/bundle/ruby/1.9.1/bin:/usr/local/bin:/usr/bin:/bin
```

### Verify R Packages

To check R was added to the path successfully and that your packages got installed, open the interactive console. Remember we installed "e1071" and "rpart" in the init.r intialization file used by the R buildpack:

```
$ heroku run R
> "e1071" %in% rownames(utils::installed.packages())
[1] TRUE
> "rpart" %in% rownames(utils::installed.packages())
[1] TRUE
> q()
Save workspace image? [y/n/c]: n
```

### Temporary CSV

Heroku's file system is *ephemeral*. Sweet. What that actually means is that when you run a recurring rake task with, say, Heroku Scheduler, Heroku will spin up a new dyno, it will read / write from the file system, and then those files will be lost forever.

Long story short, you can't use temporary SVM models, CSV, you name it. Everything has to be written to and from a cloud file host like Amazon S3. However, using [Carrierwave](https://github.com/carrierwaveuploader/carrierwave) and [Fog](https://github.com/fog/fog) gems, interfacing is as easy as the following two helper methods:

```ruby
# push file to cloud
def push(filename)
  File.open(filename, 'r'){ |f| Uploader.new.store! f }
end

# pull file from cloud
def pull(filename)
  uploader = Uploader.new
  uploader.retrieve_from_store!(File.basename filename)
  IO.write(filename, uploader.file.read)
end
```