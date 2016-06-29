I thought it would be fun to share my hassle-free deployment setup. You don't need a team of six to push the first minimum viable product. 

### Domain Name

This one is hard. Everything obvious has been taken. I personally use [domainr](https://domainr.com/) to search for domains. You can buy the domain from any registrar, [namecheap](https://www.namecheap.com/) has a good reputation. 

There are some common patterns to avoid name clash. For example if you wanted to make an app called `marker` you might use a common prefix or suffix to get something available. 

```
get{name}.com   getmarker.com
{name}app.com   markerapp.com
{name}hq.com    markerhq.com
my{name}.com    mymarker.com
```

Another option is to use a different top level domain. 

```
marker.ly
marker.io
```

The bottom line is to brainstorm lots of options, and choose whatever is available. 

### Cloudflare DNS

Sign up for **[cloudflare](https://www.cloudflare.com/a/dns/pledgehero.com)**. Once you register your new variation of a domain, point the name servers to cloudflare (`NS` in most cPanel interfaces). Cloudflare does a lot for you:

* **Easy To Use** ~ This is huge. I had trouble using the Go Daddy cPanel but CloudFlare just works. 
* **Free SSL** ~ You can point any CNAME to an https protected hosted service that supports Server Name Indication (SNI) and the SSL will just work. More on this later. You can also download a free 10-year certificate. 
* **DDOS Protection** ~ If you are ever attacked, they will protect you. I'm pretty sure you have to upgrade from free however. 
* **Force HTTPS** ~ You can force HTTPS redirect for any HTTP requests. Alternatively redirect all root domain traffic to the `www` subdomain.
* **CNAME Flattening** ~ Instead of using something like [naked domain redirect](http://wwwizer.com/naked-domain-redirect) you can point the root domain to a hosted service.

Once you point a CNAME to a hosted service and SSL just works, you can't go back. 

### Hosted Stack

I like to structure the app as follows: 

* **Static Website**: `www.getmarker.com` is a static javascript website 
* **JSON API**: serve data from `api.getmarker.com`
* **Cloud Services**: instead of building and hosting things, use external cloud services

Some dope services: 

* [github](https://github.com/) ~ source code hosting
* [drone](https://drone.io/) ~ continuous integration
* [rollbar](https://rollbar.com/) ~ error reporting
* [mailchimp](http://mailchimp.com/) ~ email marketing
* [segment](https://segment.com/) ~ web analytics

For transactional email, cloud storage, I try to use AWS services because it's cheap. I won't use AWS for anything that requires the website interface howerver. Life's too short.

### Heroku Backend

Sign up with **[heroku](https://www.heroku.com/)**. Heroku works great at small scale. I've personally never exceeded $100/m cost per app, never spent longer than 4 hours debugging a deploy issue. 

Add your custom domain and enable **SNI** for free SSL from cloudflare. 

```sh
$ heroku domains:add api.getmarker.com
$ heroku labs:enable http-sni --app <your app>
```

Go back to CloudFlare and set the CNAME to point to the heroku endpoint.

```
CNAME api marker.herokuapp.com
```

Test out the connection. You should not get any SSL errors. I use [httpie](https://github.com/jkbrzt/httpie) instead of [curl](https://curl.haxx.se/) for ad-hoc requests.

```sh
$ http https://api.getmarker.com
```

Suggested reading:

* http://12factor.net/
* https://github.com/interagent/http-api-design
* https://jwt.io/

### Netlify Website

In the past I've used Rails + jQuery, Backbone, Angular 1, and now React + Redux. Static webistes are easy to build and maintain. The best static hosting is [netlify](https://www.netlify.com/), which will build and deploy your project on each push to github. It also supports **SNI** so you get SSL free.

```
CNAME www marker.netlify.com
```

```sh
$ http https://www.getmarker.com
```

Suggested reading:

* http://redux.js.org/index.html
* https://www.ajostrow.me/articles/react-project-tips
* https://www.netlify.com/docs/redirects
* https://www.netlify.com/docs/prerendering
* https://daneden.github.io/animate.css/
* https://css-tricks.com/snippets/css/a-guide-to-flexbox/

### Sketch Design

Before you build out components, you should design them. I personally use [Sketch 3](https://www.sketchapp.com/) files prepared by an outsourced design team. Sketch is great because you can measure the distance in pixels between components and right-click to copy css attributes. 

The new version (as of June 2016) introduced "symbols" which isolate re-usable components. I would avoid symbols for unique elements that are part of a page. It breaks measuring padding and makes you change context to swtich to the symbols page and back. Strictly use symbols for re-usable components, as intended. 

See also:

* http://fontpair.co/
* http://www.flatuicolorpicker.com/
* https://github.com/utom/sketch-measure
* https://fonts.google.com/

### Invision Wireframe

Before you create a sketch design, you should design the experience. Keep in mind the user interactions are done in flows of interconnected screens and component states. When you're ready to try out the design, create an [invision](https://www.invisionapp.com/) project and ask someone to click thru the flow. 

Relevant books: 

* [Inspired ~ Marty Cagan](https://www.amazon.com/Inspired-Create-Products-Customers-Love/dp/0981690408)
* [Product Design for the Web ~ Randy Hunt](https://www.amazon.com/Product-Design-Web-Principles-Designing/dp/0321929039)

Thanks for reading,

[@aj0strow](https://twitter.com/aj0strow)
