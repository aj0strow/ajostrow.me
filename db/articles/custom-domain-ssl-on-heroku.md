First things first, buy a 1-year SSL certificate from your DNS (domain name service) such as GoDaddy, Domains Made Easy, SimpleDNS, etc. Often you must purchase a ssl credit and then 'activate' it.

### About Encryption

SSL encryption uses a private key and a public key. If the server gives out a public key, the idea is the client and server can both use a private key of their own, generate symmetric keys, and then transmit data avoiding eavesdropping.

TLS is an improved protocol, but TLS 1.0 has a security vulnerability and 1.1 on up is not widely supported as of May 2013. SSL 3.0 has similar pseudo-secure standing to TLS 1.0. Any SSL protocol below 3.0 is considered insecure.

### Private Key

You'll need openssl to generate a private key for encryption, so install it. Most major binary distribution package managers have it listed.

Navigate to a project directory, not where you keep the code, but where you save secure administrative things like credentials to various services. I put mine in "project_dir/ssl".

```
$ openssl genrsa -des3 -out server.key 2048
```

When prompted for a password, use something simple you can remember easily. The last argument, 2048, is the key size my DNS requested. The command outputs a private key to a new "server.key" file.

### Certificate Signing Request

You'll need to submit a CSR to the Certification Authority. Make sure to have the following information about your website business on hand:

- 2-letter [ISO Country Code](http://userpage.chemie.fu-berlin.de/diverse/doc/ISO_3166.html)
- State or Province
- City
- Legal Registered Organization Name
- Organization Unit (optional)
- Website or Common Name (ie facebook.com for Facebook)
- Email Address

Important note: some providers will require you to specify your subdomain explicitly, while others will secure "www.domain.com" and "domain.com" as synonyms. Make sure you're doing things correctly! Also know you can use a wildcard url like \*.domain.com but that often requires purchasing a more expensive SSL Certificate from your DNS.

```
$ openssl req -nodes -new -key server.key -out server.csr
```

After you enter all the information command-line q&a style, you should have a new "server.csr" file in the same directory as the key.

Log in to your DNS, launch your SSL Certificate, and choose 3rd Party Dedicated Server if the options exists. It should have a textarea to copy and paste in your CSR. On OSX you can copy the file to clipboard easily with:

```
$ cat server.csr | pbcopy
```

Once you have successfully applied for the certificate, theres nothing to do but wait until it is approved. Should only be about 48 hours.

### Download SSL Certificate

Once your request goes through, figure out what server it is securing. Heroku uses Nginx. Then download your new SSL certificate. Mine had two files with an extension of .crt, one of which had the same name as the domain.

Now combine the two certificates into your server certificate.

```
$ cat domain.com.crt bundle.crt > server.crt
```

Don't worry if your bundle.crt is actually a bundle.pem, or if it has a prefix or postfix. It should just say bundle somewhere in the filename.

### SSL Endpoint

Heroku does custom domain SSL through the SSL Endpoint addon, so add the addon to your site. Note that it's expensive, at $20 / month.

```
$ heroku addons:add ssl:endpoint
```

And then simply add your certificate with the following command:

```
$ heroku certs:add server.crt server.key
```

Remember to use "--remote production" or something similar if you have a default staging environment.

### Heroku's Response

If everything worked correctly, you should see something like:

```
Adding SSL Endpoint to *******-******-####... done
*******-******-#### now served by *****-###.herokussl.com
Certificate details:
Common Name(s): domain.com
                www.domain.com

... snip ...

SSL certificate is verified by a root authority.
```

### Change CNAME

```
$ heroku certs
```

Should print out something like:

```
Endpoint                  Common Name(s)            Expires               Trusted
------------------------  ------------------------  --------------------  -------
*****-####.herokussl.com  www.domain.com, domain.com  2014-05-10 15:07 UTC  True
```

Change your www CNAME record with your DNS host to the `*****-####.herokussl.com`, and then you should be all secured.

I also suggest adding permanent forwarding from the root domain to the www subdomain.
