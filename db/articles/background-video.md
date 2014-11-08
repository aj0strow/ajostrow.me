Full screen background image sliders are rather 2000-and-late. Here are the steps for ambient background video. To start, install `ffmpeg`.

```sh
$ brew update
$ brew install ffmpeg --with-libvpx --with-libvorbis --with-fdk-aac
```

Most of the `ffmpeg` command options are taken from this [Mediacrush article](https://blog.mediacru.sh/2013/12/23/The-right-way-to-encode-HTML5-video.html) with the exception of the mp4 option `-profile:v baseline` which actually corrupts the video for Chrome. 

### MP4

You need an mp4 format video to play on safari. Here's a script to do that.

```sh
#!/bin/bash

params=(
  # quality over speed
  -preset slower

  # skip audio
  -an

  # chrome needs even dimensions
  -vf 'scale=trunc(iw/2)*2:trunc(ih/2)*2'

  # html5 wants yuv420p pixel format
  -pix_fmt:v yuv420p

  # use libx264 as video codec
  -c:v libx264

  # set constant rate factor, lower is better quality
  -crf 18
)

ffmpeg -i "$1" "${params[@]}" "$2"
```

To convert.

```
$ video-mp4 input.ext output.mp4
```

The program takes any format ffmpeg accepts, which is basically all of them. 

### WEBM

To avoid depending on flash for firefox, include a webm format.

```sh
#!/bin/bash

params=(
  # quality over speed
  -preset slower

  # skip audio
  -an

  # chrome wants even dimensions
  -vf 'scale=trunc(in_w/2)*2:trunc(in_h/2)*2'

  # html5 wants yuv420p pixel format
  -pix_fmt:v yuv420p
  
  # use vp8 video encodings
  -c:v libvpx

  # sets the target bitrate to 2 MB/s (affects file size)
  -b:v 2M

  # set constant rate factor, lower is better quality (affects file size)
  -crf 5
)

ffmpeg -i "$1" "${params[@]}" "$2"
```

And to convert.

```sh
$ video-webm input.ext ouput.mp4
```

### Background

Install use **[dfcb/BigVideo.js](https://github.com/dfcb/BigVideo.js)** to render the video as a background. 

```sh
$ bower install --save BigVideo.js
```

Include the scripts.

```sh
bower_components/jquery/dist/jquery.min.js
bower_components/imagesloaded/imagesloaded.pkgd.min.js
bower_components/video.js/dist/video-js/video.js
bower_components/BigVideo/lib/bigvideo.js
```

Use the big video package supplying the videos created above.

```javascript
$(function() {
    var BV = new $.BigVideo({ useFlashForFirefox: false })
    BV.init()
    BV.show([
      { type: 'video/mp4', src: '/assets/background.mp4' },
      { type: 'video/webm', src: '/assets/background.webm' }
    ], { ambient: true })
})
```

The big video projects notes that mobile browsers don't allow auto-play. They suggest to use modernizr with a fallback full screen image. 

### Styling

The video will have padding without a css reset. The background should also start with a black background to indicate a video should be loading.

```sh
$ bower install --save normalize-css
```

Include the stylesheet.

```sh
bower_components/normalize-css/normalize.css
```

Big video also writes an error message before it loads, so keep the font unreadable in the body tag and make the relative view have visible font. If the main wrapper container isn't relative it will be behind the video. 

```css
body {
  background: #000;
  color: #000;
}

.view {
  position: relative;
  color: #fefefe;
}
```

That's it. Looping background video.
