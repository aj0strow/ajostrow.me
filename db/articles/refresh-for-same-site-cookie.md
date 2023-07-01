One of the common ways to identify a user is with an access token. For a lot of websites, the token is issued after a login process and sent as a cookie in a redirect.

```
HTTP/2 302 Redirect
Location: /
Set-Cookie: token=secret; ...; ...;
```

### Setting Cookies

Most frameworks provide high level abstractions for cookies. How it actually works is browsers look for a `Set-Cookie` header on responses and keep track of a list of cookies by name for each site. You can inspect the cookies in the browser developer tools.

How it used to work is browsers would send all of the cookies in a `Cookie` header to all of the sites. You can imagine that would be super insecure if one of the cookies is `accesstoken` for the site `bank.com` and another site `game.net` can see the cookie too. In order to send the right cookies to the right servers there are [attributes for cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes).

### Same Site Attribute

One of the attributes is `SameSite` which controls whether the browser will send the cookie in requests to servers hosted on a different domain. For example if you set the cookie on `bank.com` and make a request to `game.net` it would be considered a cross site request.

The possible values are well documented but I will add some commentary.

- `None` is completely insecure. It must be for ads.
- `Lax` is reasonably secure. The browser will only include the cookie if the request is coming from the same site or navigating to the same site. The risk of `Lax` is that any GET route can be spoofed. For example if `bank.com` has a `GET /logout` route to sign out, the `game.net` site could have a script to open a new tab for `bank.com/logout` and sign out the user. It could also impact metrics or any other action that is through a GET and not a POST request.
- `Strict` is extra secure. The cookie will only be sent if the request is from the same page or "fetch context". The downside is that if you are on `spreadsheet.io` managing your finances and click a link to open `bank.com/transfers/84733` even if you are signed in on `bank.com`, the request is cross site, so `bank.com` will not see the cookie. Most sites redirect the user to the login page if they don't provide a valid access token.

There is a peace of mind to having the `SameSite=Strict` but it can be confusing and annoying for users coming in from links from other sites. You click a link and it feels like you got logged out.

Luckily there's a hack to make it work.

### Immediate Refresh Hack

The fix for `SameSite=Strict` cookies is to check if the request is cross site, load a page so that you are now on the same site, then immediately refresh so that you are loading the page from the same site to get the cookie.

- Click a link (spreadsheet.io)
- Open a new tab (bank.com)
  - Detect the page is a cross site request
  - Include a snippet to refresh to page
- Refresh the page (bank.com)
  - Detect the page is a same site request
  - Look for a cookie to authenticate the user

It does not usually work to check if the referrer is cross site. Most websites include the `rel="noopener noreferrer"` on cross site links which sets the `Referrer` header to the same site.

```
Referrer: bank.com
```

In the last year or so browsers have started including security context headers which allows detecting if the request is from the same site or cross site. There is no security issue if older browsers do not include the headers. In that case the user would have to manually refresh or sign in again. The headers look like this for a user visiting from a different site.

```
Sec-Fetch-Site: cross-site
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
```

The code to detect a cross site visit could look like the following.

```py
cross_site = headers['Sec-Fetch-Site'] == 'cross-site' and headers['Sec-Fetch-Mode'] == 'navigate' and headers['Sec-Fetch-Dest'] == 'document'
```

When that condition holds, include a script to refresh the page from the page itself which is a same site security context. There is a [conversation going back a number of years](https://bugzilla.mozilla.org/show_bug.cgi?id=1459321) for why Firefox needs to refresh in a particular way instead of the standard `location.reload(true)`.

```html
{% if cross_site %}
<script>
  window.location = window.location
</script>
{% endif %}
```

It seems like a reasonable tradeoff to have a little bit of extra latency for visitors from other sites on the first request if it means there is less risk to monitor the codebase for any GET request that might do anything.
