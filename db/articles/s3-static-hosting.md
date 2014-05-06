Amazon Web Services as a whole is a fantastic tool, and Route 53 with S3 is sweet combination. Like to the tune of file hosting, database backups, asset and static website serving, short url redirection, and vanity subdomains. 

### Subdomains

Add your domains to Route 53, and point the nameservers from the domain registrar (Go Daddy, Namecheap, etc.) to the amazon endpoints. There should be at least four of them. 

To add a vanity subdomain, like sandbox.domain.com for the staging environment, add the record as a CNAME and point to the staging endpoint. Now showing off unreleased features looks way more legit. Nice!

It propagates in 300ms so the new vanity domain should be visible immediately. 

### Static Hosting

When building landing pages or other server-less websites, even $8/m for standard cheap php hosting sucks, because it's slow and costs $8/m. 

Develop locally using real url paths with the node static server, and deploy to S3. Warning: the bucket name needs to match the domain perfectly. 

```
$ npm install -g node-static
$ static
```

To sync the current working directory with an s3 bucket, the command needs access to aws credentials. The easiest way is likely to put them in the environment. 

```shell
# .env

AWS_ACCESS_KEY_ID=***********
AWS_SECRET_ACCESS_KEY=**********
```

Install the cli tools and sync.

```
$ pip install aws-cli
$ export $(cat .env)
$ aws s3 sync . s3://www.domain.com --acl public-read --exclude ".*" --delete
```

Enable static website hosting on the bucket, and then open up Route 53. Create a new DNS rule to point the www subdomain to the bucket as an alias. The S3 bucket endpoint should come up in the menu. 

### Redirecting

In the static website hosting menu in S3, there's an option to redirect all requests to a new domain. Create a new bucket domain.com, and redirect everythign to www.subdomain.com. Add the alias rule on Route 53 as well without specifying a subdomain. 

Every visitor to domain.com will be quickly redirected to www.domain.com. Without this step it 404s. An empty bucket cluttering the UI is a small price to pay for the root domain to work.

You don't need to redirect to the same domain though, you can redirect anywhere. Suppose you have a short url like doma.in for twitter purposes. Routes need to be at the root to keep the url short, but straight redirection would mean respecting short character sequences at the root of the main application. A routing nightmare.

Instead, add doma.in to Route 53, and point the nameservers as before. Create a doma.in bucket and choose the redirect all requests option for static hosting. Set the domain to www.domain.com/redirect. It just works. doma.in/bs8k4 will be redirected to www.domain.com/redirect/bs8k4. 

Then in the application, the redirect route can redirect one last time to the real url. This way you don't need short url service running as well as the main application. 
