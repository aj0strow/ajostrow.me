There are a lot of guides for how to precompile assets to S3, however most are missing key information.

### Syncing Assets

There's a gem for syncing assets with S3. It's called [asset_sync](https://github.com/rumblelabs/asset_sync). Add it to your Gemfile:

```ruby
# Gemfile

gem 'asset_sync'
```

```
$ bundle install
```

There are two ways to configure the gem, either with environment variables or an initializer. I use Amazon S3, but it's easy to use Google Storage or Rackspace too. 

The environment variables are as follows:

```
FOG_PROVIDER=AWS
FOG_DIRECTORY=bucket-name
AWS_ACCESS_KEY_ID=****
AWS_SECRET_ACCESS_KEY=******

# optional

FOG_REGION=us-east-1
ASSET_SYNC_GZIP_COMPRESSION=false
ASSET_SYNC_MANIFEST=false
ASSET_SYNC_EXISTING_REMOTE_FILES=delete
```

The other option is with an initializer. You can generate a new initializer file with:

```
$ rails g asset_sync:install --provider=AWS
```

The initializer looks like the following:

```ruby
# config/initializers/asset_sync.rb

AssetSync.configure do |config|
  
  # AWS S3 config
  config.fog_provider = 'AWS'
  config.fog_directory = 'bucket-name'
  config.aws_access_key_id = ENV['AWS_ACCESS_KEY_ID']
  config.aws_secret_access_key = ENV['AWS_SECRET_ACCESS_KEY']

  # Increase upload performance by configuring your region
  config.fog_region = 'us-east-1'

  # Don't delete files from the store
  config.existing_remote_files = "keep"

  # Automatically replace files with their equivalent gzip compressed version
  config.gzip_compression = true

  # Use the Rails generated 'manifest.yml' file to produce the list of files to
  # upload instead of searching the assets directory.
  config.manifest = true

  # Fail silently.  Useful for environments such as Heroku
  config.fail_silently = false
end
```

### YAML Configuration

If your configuration changes for different app environments, it may be worth using a yaml configuration file.

```yaml
# config/fog.yml

shared: &shared
  provider: AWS
  public: true

production:
  <<: *shared
  directory: bucket-name
  region: us-west-2

development:
  <<: *shared
  directory: bucket-name-dev
  region: us-east-1

# .. etc ..
```

And then load it in your initializer:

```ruby
# config/initializers/asset_sync.rb

  fog_settings = YAML.load_file(Rails.root.join('config', 'fog.yml'))[Rails.env]
```

### Amazon S3 Regions

It's a pain to find anything in the endless Amazon docs, so I've copied the bucket regions here. 

To figure out the region for your bucket, log into your management panel and click on properties. It should tell you the common name for the region. Use the corresponding region name. 

```
Common Name                              Region Name
---------------------------------------------------------
US Standard                              us-east-1
US West (Oregon) Region	          us-west-2	
US West (Northern California) Region     us-west-1
EU (Ireland) Region	              eu-west-1	
Asia Pacific (Singapore) Region	  ap-southeast-1
Asia Pacific (Sydney) Region	     ap-southeast-2	
Asia Pacific (Tokyo) Region	      ap-northeast-1
South America (Sao Paulo) Region 	sa-east-1
```

### Rails Environment

Asset syncing requires a few settings for the application as well. 

```
# config/environments/production.rb

  # we're using S3 for assets now!
  config.serve_static_assets = false
  config.assets.compile = false

  # compress JavaScripts and CSS
  config.assets.compress = true

  # generate digests for assets URLs
  config.assets.digest = true

  # if you're using an initializer
  config.assets.intialize_on_precompile = true

  # set the folder assets are saved to in your bucket
  config.assets.prefix = "/assets"

  # tell rails to get assets from S3
  config.action_controller.asset_host = "//bucket-name.s3.amazonaws.com"
```

### Heroku

If you want your assets to be compiled as part of the deploy, use the experimental Heroku feature for your app:

```
$ heroku labs:enable user-env-compile -a app-name
```

It should compile and sync your apps when you deploy, so you no longer have to check in and remove assets from source control. 

### Notes

Adding the fog region supposedly speeds up the process. 

The gzip option will actually replace the real files with the zipped equivalent. It sounds dangerous, but according to [this StackExchange post](http://webmasters.stackexchange.com/questions/22217/which-browsers-handle-content-encoding-gzip-and-which-of-them-has-any-special) it's been a decade since a browser didn't support gzipped assets. 

If you want to perform a sanity check on the content type, caching and zipping, you can see the HTTP headers in the S3 dashboard. Select a file, click the "properties" tab, and then expand the "Metadata" section. You'll see key / value pairs for HTTP headers.

```
Content-Type: text/javascript
Cache-Control: public, max-age=31557600
Expires: Sat, 20 Sep 2014 07:35:27 GMT
Content-Encoding: gzip
```

I checked one of each type of asset (font, script, image, etc.) and everything got configured as expected, so save yourself the time! 