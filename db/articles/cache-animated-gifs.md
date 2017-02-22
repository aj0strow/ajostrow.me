I caused a bug yesterday on the [Thinkwire home page](https://www.thinkwire.com/). It's fixed now, so if you scroll down the page some static images are replaced with animated GIFs. Each animation plays to conclusion and when the image is no longer in view, the animation resets. 

A few weeks ago I added a rule to `nginx.conf` which matches assets with a fingerprint and sets the max cache expiration. 

```
    location ~ '[0-9a-f]{16}\.(js|js\.map|css|png|jpg|gif)$' {
        expires max;
    }
```

It works as expected. When you visit the site for the first time, each GIF is downloaded, and on subsequent visits the GIF is read from the browser disk cache. Unfortunately and inexplicably **the browser won't play cached GIF animations**. You scroll down the page and nothing happens. 

### Cache Busting

The quick and dirty solution is to prevent caching by appending a random query string. 

```js
img.src = `/path/to/animation.gif?v=${ Math.random() }`
```

There are two issues with cache busting. First, it wastes bandwidth because the client needs to download the complete animation (500kb or more) on each replay. Second, the playback is choppy and unpredictable because frame rate is dependent on download speeed. 

We need better. 

### Unique Object URLs

We need to reframe the problem. The issue is not image caching (that's a good thing) the issue is the browser won't play a GIF animation twice. Instead of reloading from the server, we can preload the image *Blob* once and use the *Blob* to create lots of unique *Object URLs* in memory. 

When the component or page mounts, fetch the image *Blob*. It should load from cache if you set cache headers on the file. 

```js
    loading = true;
    cachedAnimationBlob;

    onMount() {
        fetch("/path/to/animation.gif")
            .then(response => response.blob())
            .then(blob => {
                // Store blob for later use.
                this.cachedAnimationBlob = blob
                this.loading = false
            })
    }
```

Once the *Blob* is done loading, set image `src` to a brand new *Object URL* to play the GIF animation. According to Mozilla, each *Object URL* is unique and must be revoked when no longer needed to avoid leaking resources. 

```js
    uniqueAnimationSrc;
    
    onUnmount() {
        if (this.uniqueAnimationSrc !== undefined) {
            URL.revokeObjectURL(this.uniqueAnimationSrc)
        }
    }

    playAnimation() {
        if (!this.loading) {
            if (this.uniqueAnimationSrc !== undefined) {
                URL.revokeObjectURL(this.uniqueAnimationSrc)
            }
            this.uniqueAnimationSrc = URL.createObjectURL(this.cachedAnimationBlob)
            this.setImage(this.uniqueAnimationSrc)
        }
    }
    
    setImage(src) {
        // Set the image however you want.
        querySelector("img#animation").src = src
    }
```

Voilà. You can replay non-looping GIF animations. 
