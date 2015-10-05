When you need to deal with files, [Amazon S3](https://aws.amazon.com/s3/) is reliable and fast. Even so, there's a few disparate steps involved to upload directly from the user's browser to amazon servers. Read on for step-by-step.

### IAM Bucket Access

I use the cloud which means I don't have too much control or visibility into security. If my servers were compromised, I'd feel pretty dumb granting root account access when all I wanted was file uploads. To prevent carte blanche access, create a new IAM user.

```
AWS / Services / IAM / Users / Create New
```

Assign the user s3 privileges. Here's an example policy for user "Thinkwire". In the policy below, the resource array points to s3 buckets following the pattern `arn:aws:s3:::$BUCKET_NAME/*`. 

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1417563999000",
            "Effect": "Allow",
            "Action": [
                "s3:*"
            ],
            "Resource": [
                "arn:aws:s3:::thinkwire/*",
                "arn:aws:s3:::thinkwire-test/*",
                "arn:aws:s3:::thinkwire-development/*",
                "arn:aws:s3:::thinkwire-sandbox/*"
            ]
        }
    ]
}
```

Create a new access key and store the credentials for later. You should have an **access key id** and a **secret access key**. 

### Enable CORS

Our goal is client uploads direct to s3, which requires CORS requests from the web app to amazon servers. For **each bucket** add a CORS Configuration or it will break with HTTP 403 errors. 

```
AWS / Services / S3 / $BUCKET_NAME / Properties / Permissions / Edit CORS Configuration
```

The configuration is XML with rules enumerated one at a time. For thinkwire, i wanted PUT requests to come from the website and GET requests to come from anywhere. You need to choose the rules best for your app. 

```xml
<CORSConfiguration>
    <CORSRule>
        <AllowedOrigin>http://www.thinkwire.com</AllowedOrigin>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
    <CORSRule>
        <AllowedOrigin>https://www.thinkwire.com</AllowedOrigin>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
        <AllowedHeader>Authorization</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
```

### Pre-Signed Endpoint

Getting closer. The next step is to provide a server endpoint to generate a presigned url for each upload. Here's an example of how to do that in **ruby** but you can use any language supported by AWS SDK. 

```ruby
require 'sinatra'
require 'json'
require 'aws-sdk'
require 'aws-sdk-resources'
require 'securerandom'

get '/uploads' do
  # Some user auth here. 
  
  key = "uploads/#{ SecureRandom.uuid }"
  credentials = Aws::Credentials.new(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  s3 = Aws::S3::Resource.new(region: AWS_REGION, credentials: credentials)
  bucket = s3.bucket(AWS_S3_BUCKET)
  presigned_url = bucket.object(key).presigned_url(:put, acl: 'public-read')
  
  content_type :json
  { url: presigned_url }.to_json
end
```

Each file upload needs to request a new presigned url. In this example the s3 object key is generated on the server, but it could also be requested by the client.

```
GET /uploads
=> { url: "pretty-long-aws-upload-url" }
```

### Upload Client-Side

To upload a file from `input[type="file"]` you need to read it into an array of bytes, request a new presigned url, and then send the bytes to s3. Here's some example code:

```javascript
function requestUrl (user) {
  return fetch('/uploads', { user: user })
}

function readFile (file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function (event) {
      resolve(event.target.result)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function uploadFile (user, file) {
  return Promise.all([
    requestUrl(user),
    readFile(file),
  ]).then(function (results) {
    var url = results[0].url
    var bytes = results[1]
    return fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: new Int8Array(bytes),
    })
  }).then(function (response) {
    if (response.status >= 200 && response.status < 300) {
      return response.json()
    } else {
      throw new Error('upload failed')
    }
  })
}
```

With the `uploadFile` function it's possible to take input change events, and store s3 urls where the file was just saved. 

```javascript
var fileInput = document.getElementById('fileInput')

fileInput.onchange = function (event) {
  // Communicate pending upload to user.
  
  var files = event.target.files
  Promise.all(
    files.map(function (file) {
      return uploadFile(user, file)
    })
  ).then(function (responses) {
    var urls = responses.map(function (response) {
      return response.url.split('?')[0]
    })
    // Save urls somewhere nice. 
  }).then(function () {
    // Communicate success to user. 
  })
}
```

All done. As promised, s3 client uploads. 

I was extremely pleased with the speed. If you're used to server side uploads, you're probably not used to sending a couple 5Mb images up to the cloud in under a second. You get speed on upload, and the architecture forces you to process the files later in a background job, which is usually what you want. 

Thanks for reading. Tweet [@aj0strow](https://twitter.com/aj0strow) if i screwed up somewhere. 
