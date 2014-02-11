Rails is a pretty dreamy web framework, and Amazon's Elastic Beanstalk is a pretty dreamy deployment situation. Here's how I started a rails application called Thinkwire.  

I'll be using mac shell commands, so if you're on windows this article is likely not for you, sorry!

### New Application

I'm planning on using mongodb and rspec instead of active_record and minitest, so I skipped those in the new command. 

```
$ rails new thinkwire --skip-active-record --skip-test-unit
$ cd thinkwire
$ rm -r lib db vendor
$ mv README.rdoc README.md
```

Create a simple action just so we can verify everything is working later on.

```ruby
# app/controllers/application_controller.rb

  def root
    render text: "Thinkwire\n"
  end
```

```ruby
# config/routes.rb

  root "application#root"
```

```
$ rails server &
$ curl localhost:3000
Thinkwire
```

Basically just a hello world. Time to deploy.

```
$ kill -9 %1
$ git init
$ git add .
$ git commit -m 'initial commit'
```

### Staging Environment

```
$ brew install aws-elasticbeanstalk
```

Beanstalk maps git branches to deployment environments, so check out a staging branch.

```
$ git checkout -b staging
```

Have your amazon credentials on hand. 

```
$ eb init
.. enter keys ...
.. choose region ..
name:   thinkwire
environment:   thinkwire-staging
stack:   64bit Amazon Linux 2013.09 running Ruby 1.9.3
type:   Single Instance
database:   no
instance profile:   default
```

Alright, it's ready!

```
$ git commit -am 'ignore beanstalk config'
$ eb start
.. have a beer ..
$ git aws.push
$ eb status
URL    : thinkwire-staging-7bvrbtf2kc.elasticbeanstalk.com
Status : Ready
Health : Green
```

The environment should be launched! Let's make sure.

```
$ curl thinkwire-staging-7bvrbtf2kc.elasticbeanstalk.com
Thinkwire
```

Unfortunately we've only just begun. 

### Environment Variables

In the software configuration, Passenger will overwrite RACK_ENV, RAILS_ENV and any other ENV variable to production even if you put staging. It has to be patched in the code.

```ruby
# config/environment.rb

# Fix the environment
if ENV['STAGING']
  %w(RACK_ENV RAILS_ENV).each do |key|
    ENV[key] = 'staging'
  end
  Rails.env = 'staging' if defined?(Rails)
end
```

Then make a new environment variable called STAGING and put the value as true. 

### Production Environment

```
$ git checkout -b production
$ eb branch
environment name:   thinkwire-production
copy settings from staging:   no
type:   Load Balanced
create database:   no
instance profile:   2 (same one as before)
```

Time to deploy to production.

```
$ eb start
.. another beer ..
$ git aws.push
$ eb status
URL    : thinkwire-production-k4mmxai8mk.elasticbeanstalk.com
Status : Ready
Health : Green
```

One more check.

```
$ curl thinkwire-production-k4mmxai8mk.elasticbeanstalk.com
Thinkwire
```

### Deployment Flow

Amazon suggests the following workflow:

#### 1\. check out feature branch 

```
$ git checkout -b email-registration
```

#### 2\. implement the feature

gem 'devise'
...

#### 3\. deploy to staging to make sure it works

```
$ git checkout staging
$ git merge email-registration
$ git aws.push
```

#### 4\. it works. merge into master and push to github private repo

```
$ git checkout master
$ git merge email-registration
$ git push origin master
```

#### 5\. a couple days later, deploy a bunch of features to all the users (or a couple friends, w/e)

```
$ git checkout production
$ git merge master
$ git aws.push
```

It's like Heroku, except you don't have to pay $60 / month for auto-scaling. You can even get fancy, and have a continuous integration environment automatically run tests on every commit. I'm not that fancy. 

### Custom Domain

It really needs to be thinkwire.com and not thinkwire-production-k4mmxai8mk\.elasticbeanstalk\.com. 

Open up the aws console and navigate to "Route 53". Click "Create Hosted Zone". Enter the domain and the name for the comment (I put "thinkwire.com" and "Thinkwire"). Click "create" and then double-click the new hosted zone. 

Usually at this stage you'll want to set up static hosting on an S3 bucket with a "Coming Soon" page. There's a bunch of articles on how to do that so I won't go into it here. If you do that, create a record set, A (alias), click alias, and the s3 bucket should be an option.

Once you're ready to actually deploy the production app to the domain, go to the domain registrar (godaddy, namecheap, domainsmadeeasy, etc.). Don't let them handle the DNS. Instead point the domain to the four nameservers listed as NS records.

There are two ways to alias the common name to the load balancer. The easiest is to create a new A record and select that it is an alias. The load balancer should come up in the menu. 

Another possibility is to make a CNAME alias for a longer ttl. Create a new record and fill out the form like so, ignoring fields not mentioned below.

```
Name:    www.thinkwire.com
Type:    CNAME - Canonical Name
Value:   thinkwire-production-k4mmxai8mk.elasticbeanstalk.com
```

It takes an hour or two to propagate, so remain calm and poised. Go on to getting an SSL certificate while you wait. Eventually check it worked though.

```
$ curl www.thinkwire.com
Thinkwire
```

### Request Certificate

We need secure web sockets, so we'll need a commercial RSA Certificate. I like to store this information in the git repo so it's not lost.

```
$ mkdir .ssl
$ cd .ssl
```

Create a private key and a certificate request.

```
$ openssl genrsa 2048 > private-key.pem
$ openssl req -new -key private-key.pem -out csr.pem
country:   CA
province:   Ontario
city:   Toronto
organization:   4More Innovation
unit:
common name:   thinkwire.com
email address:   admin@thinkwire.com
```

Now head over to where your domain is hosted, and get a certificate through them. As you can see in the common name, I tend to rock wildcard domains because it's worth the extra $50 not to be limited in the future. 

If you really want to save cash, change the common name to www.domain.com. You can create as many keys and requests as you'd like. You only pay for the requests you actually submit. 

```
$ git add .
$ git commit -m 'ssl request'
```

### Upload Certificate

You'll usually get a confirmation email with a code. Click through, copy-paste the code, and typically within the day you'll get an email with certificates in a zip. 

The certs will be named something like the following:

```
$ ls STAR_thinkwire_com
STAR_thinkwire_com.crt   PositiveSSLCA2.crt   AddTrustExternalCARoot.crt
```

The STAR_thinkwire_com.crt (STAR for * wildcard) is the public key. The positive ssl certificate is an intermediary certificate between the server cert and the root cert. The ca root cert is a certificate that the browser recognizes as legit.

The secret key can't be protected by a password. Decrypt it.

```
$ openssl rsa -in private-key.pem -out server-key.pem
```

There's a problem though. Amazon likes keys in PEM or plaintext format, not base64 encoded binary format. Each must be converted.

```
$ openssl x509 -in STAR_thinkwire_com.crt -outform PEM > server-crt.pem
$ openssl x509 -in PositiveSSLCA2.crt -outform PEM > positivessl-crt.pem
$ openssl x509 -in AddTrustExternalCARoot.crt -outform PEM > caroot-crt.pem
$ rm *.crt
$ git add .
$ git commit -m 'added ssl certs'
```

Next, go to the AWS web portal, navigate to EC2. Click on "Load Balancers" and choose the only one there (unless you were silly and load-balanced your staging environment). Click the instances tag. Mine says "thinkwire-production". 

Click on "Listeners", and select the following options.

```
L.B. Protocol | L.B. Port | I. Protocol | I. Port
---------------------------------------------------
HTTPS         | 443       | HTTP        | 80
```

Don't touch "Cipher". Click "select" under SSL Certificate. Remember that if you mess up, you can always upload a new certificate. 

For certificate name I put "thinkwire-com". Copy paste the private key, server certificate (public key) and the certificate chain into the respective fields. Use cat and pbcopy to avoid whitespace or text editor line-encoding issues. 

```
$ cat server-key.pem | pbcopy
$ cat server-crt.pem | pbcopy
$ cat server-crt.pem positivessl-crt.pem caroot-crt.pem | pbcopy
```

The order for the certificate chain is extremely important. Server certificate, issuer certificate, and lastly root certificate. Click "save".

```
$ openssl s_client -connect www.thinkwire.com:443
connect: Operation timed out
connect:errno=60
```

It's still not working. Turns out the port needs to be opened in the firewall (security group) in addition to listening to it. 

In EC2 menu still, navigate to "Security Groups" and select the load balancer. Click on the inbound tab and create a new rule for https. Click "Apply Rule Changes". 

```
$ openssl s_client -connect www.thinkwire.com:443
CONNECTED(00000003)
...
```

Doublecheck the certificate is working properly by entering your domain at [SSL Checker](http://www.sslshopper.com/ssl-checker.html). Should be all green. 

### Notes

Nokogiri and possibly other gems with native extensions are only supported for specific versions. Nokogiri for instance is not supported at 1.6.1, but only at 1.5.2. 

What will happen is you'll aws.push and the app won't change after a long waiting period (~ 15 minutes). Snapshot the logs, and search for ERROR. The bundle failed one looks like the following.

```
Installing nokogiri (1.6.1) 
Gem::Installer::ExtensionBuildError: ERROR: Failed to build gem native extension.

        /usr/bin/ruby1.9 extconf.rb 
Extracting libxml2-2.8.0.tar.gz into tmp/x86_64-amazon-linux/ports/libxml2/2.8.0... OK
Running 'configure' for libxml2 2.8.0... OK
Running 'compile' for libxml2 2.8.0... ERROR, review 'tmp/x86_64-amazon-linux/ports/libxml2/2.8.0/compile.log' to see what happened.
*** extconf.rb failed ***
Could not create Makefile due to some reason, probably lack of
necessary libraries and/or headers.  Check the mkmf.log file for more
details.  You may need configuration options.
...
ERROR: bundle install failed!
```

To fix these problems, check the [Amazon Linux Packages page](http://aws.amazon.com/amazon-linux-ami/2012.03-packages/). Search for the gem name, and it'll come up with the supported version.

```
rubygem-nokogiri-1.5.2
``` 

Lock in that version in the Gemfile and Gemfile.lock.

```ruby
# Gemfile

gem 'nokogiri', '1.5.2'
```

```
$ bundle update
```