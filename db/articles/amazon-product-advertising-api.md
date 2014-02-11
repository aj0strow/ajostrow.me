Trying to make sense of the Amazon documentation is an absolute nightmare. Here's some tips on how to get started.

### Get Your Credentials

Grab your access keys on the [security credentials page](https://portal.aws.amazon.com/gp/aws/securityCredentials).

Make sure you have applied as an affiliate as well. If you haven't, [sign up](https://affiliate-program.amazon.com/gp/flex/advertising/api/sign-in.html). You'll need the associate tag to collect commission. 

### Learn the API

All of the operations are available [here](http://docs.aws.amazon.com/AWSECommerceService/2011-08-01/DG/CHAP_OperationListAlphabetical.html). To simply get products, you'll probably want the ItemSearch and ItemLookup.

When you query the API, you also have to specify [ResponseGroups to get back](http://docs.aws.amazon.com/AWSECommerceService/2011-08-01/DG/CHAP_ResponseGroupsList.html). Of particular interest are the Small and Images response groups. 

You can combine response groups to make custom return data field sets. 

### UTC Timestamp

All requests now require a UTC timestamp, which can be properly added to request options as follows:

```ruby
def add_timestamp_to(options)
  date, time = Time.now.utc.to_s.split(' ')
  options[:Timestamp] = "#{date}T#{time}Z"
end
```

### Signing Requests

The [documentation for authenticating requests](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/Query_QueryAuth.html) gives the steps, but no sample code in Ruby. 

Assuming you pass in a bunch of parameter options (including a timestamp), here is how you get out a properly formed query. 

I use HTTParty for the request, so it made sense to use it to convert the params to a query string as well. 

```ruby
@aws_secret_key = '******************'

def signature_query_from(options)
  # sort params by byte order (alphabetic)
  sorted = options.to_a.sort_by { |pair| pair.first.to_s }

  # convert sorted params to query string
  query = HTTParty::HashConversions.to_params(Hash[sorted])

  # create signature data string
  data = ['GET', 'webservices.amazon.com', '/onca/xml', query].join("\n")

  # create signature
  sha256 = OpenSSL::Digest::SHA256.new
  digest = OpenSSL::HMAC.digest(sha256, @aws_secret_key, data)
  signature = Base64.encode64(digest)
  
  # return full query string
  query + '&Signature=' + signature
end
```

### Put It All Together

```ruby
@locale = 'ca'

def amazon_url
  "http://webservices.amazon.#{ @locale }/onca/xml"
end

def get(options)
  add_timestamp_to(options)
  HTTParty.get(amazon_url + '?' + signature_query_from(options))
end
```

Took me a long afternoon to figure all that out, so thought I'd share it! Source code with a ruby gem here: https://github.com/aj0strow/amazon_product_api