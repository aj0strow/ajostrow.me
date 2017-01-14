I figured out how to deploy static sites with [nginx](https://www.nginx.com/). Here's all the steps it takes to deploy a webpack build on Ubuntu cloud instance. 

### Upload Certs

You need to copy over certificate and private key to serve https. I chose to use a Cloudflare free origin certifate for `*.example.com` and `example.com`. It expires in 15 years (schedule a notification!) which seemed adequate. 

I chose to name the certifcate `example-com.pem` and key `example-com-key.pem`. I haven't seen much on naming conventions online, so I put keys on my local computer in `~/certs` and copy them using `scp` to each remote host. 

```
$ ssh root@1.1.1.1 'mkdir /var/certs'
$ scp ~/certs/example-com* root@1.1.1.1:/var/certs
```

### Upload Site

Next, upload the build folder to the remote instance. I name the builds by the git commit sha1 but you could use semvers or timestamps. 

```
$ git rev-parse HEAD
```

I keep builds in the `/var/builds` folder.

```
$ scp -r dist root@1.1.1.1:/var/builds/1d4e676dae26d8a
```

Every build should be in `/var/builds` on the remote machine. To deploy a version, symlink the desired build into a fixed place. I chose `/var/builds/current` but it probably makes sense to use a separate folder in the future. 

```
$ ln -sfn /var/builds/1d4e676dae26d8a /var/builds/current
```

You can check the current version by reading the symlink. 

```
$ readlink /var/builds/current | xargs basename
```

### Setup Nginx

Install [nginx](https://www.nginx.com/resources/admin-guide/). 

```
$ apt update
$ apt install nginx
```

Remove the default example sites.

```
$ ssh root@1.1.1.1
~# rm /etc/nginx/sites-enabled/default
~# rm /etc/nginx/sites-available/default
```

Add a new site to serve the current build described above. If that sounds daunting, read [edit remote files](/articles/edit-remote-files) and then come back.

```
# /etc/nginx/sites-enabled/example-com

server {
    server_name example.com;
    
    listen 80;
    listen [::]:80;

    listen 443 ssl;
    listen [::]:443 ssl;
    ssl_certificate /var/certs/example-com.pem;
    ssl_certificate_key /var/certs/example-com-key.pem;

    root /var/builds/current;
    index index.html;
}
```

Reload the server after each change. It won't accept syntax errors. 

```
~# nginx -s reload
```

You should be able to open the http site in a browser. 

### Doman Name

I use CloudFlare for DNS which works with free wildcard certs mentioned above. Point to the ipv4 using A record.

```
A     www     1.1.1.1
```

Once the domain record propagates, you should be able to view the site in a browser and get an https secure lock icon. 

### Push State

If you have a single page app using push state, you'll notice when you refresh any page besides the index, the site breaks with a `404 Not Found`. Edit the nginx conf to fallback to the index page.

```
# 1.1.1.1 : /etc/nginx/sites-enabled/example-com

    location / {
        try_files $uri /index.html =404;
    }
```

An unfortunate side effect is that requests for missing assets will return a `200 Success` and the index page instead of `404 Not Found`. You can fix this using a higher precedent regular expression location match looking for file extensions. 

```
    location ~ '\.[a-z]{1,8}$' {
        try_files $uri =404;
    }
    
    # push state ...
```

I haven't seen a file extension break this heuristic before. 

### Asset Caching

If you include a content hash in asset file names, fire up some cache headers. 

```
vendor.js  =>  vendor.452eb03b75345c84f923.js
```

Exit `nginx` configuration one more time to add cache headers.

```
    # Cache fonts. I chose to use a prefix instead of file extension to avoid
    # committing to caching all .svg files. 
    location /fonts/ {
        expires max;
    }
    
    # Cache anything with a 16+ hex sequence followed by a common asset extension.
    # This avoids situations where you need non-hashed assets too.
    location ~ '[0-9a-f]{16}\.(js|js\.map|css|png|jpg|gif)$' {
        expires max;
    }
    
    # push state ...
```

You can verify the caching works by checking headers. I use [httpie](https://github.com/jkbrzt/httpie) for command line requests. 

```
$ http HEAD https://www.example.com/vendor.452eb03b75345c84f923.js
```

### Re-deploy

When you want to push the latest version, upload a new build and symlink to deploy. 

```
$ sha1=`git rev-parse HEAD`
$ scp -r dist root@1.1.1.1:/var/builds/$sha1
$ ssh root@1.1.1.1 "ln -sfn /var/builds/$sha1 /var/builds/current"
```

You should see the new version live. 
