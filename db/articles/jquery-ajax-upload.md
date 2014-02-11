Uploading files can take a while, especially if you are generating waveforms, waiting for a video encoding service, or even creating a bunch of different image sizes. It's way better to submit them asynchronously so there's no immediate wait.

Here's how I use the plugin:

```javascript
$('#video-form').ajaxify({
  progress: function(e) {
    if (e.lengthComputable) {
      $('#video-progress').attr({ value: e.loaded, max: e.total });
    }
  },
  beforeSend: function() {},
  complete: function() {},
  error: function() {},
  success: function(response) {}
});
```

Here's the code for the plugin:

```javascript
$.fn.extend({
  ajaxify: function(options) {
    var path = $(this).attr('action');
    $(this).submit(function(evnt) {
      evnt.preventDefault();
      var formData = new FormData(this);
      var ajaxOptions = {
        url: path,
        type: 'POST',
        data: formData,
        dataType: 'json',
        cache: false,
        contentType: false,
        processData: false
      }
      $.each(['beforeSend', 'complete', 'success', 'error'], function(i, key) {
        if(options[key]) { ajaxOptions[key] = options[key]; }
      });
      if(options.progress) {
        ajaxOptions['xhr'] = function() {
          var uploadXhr = $.ajaxSettings.xhr();
          var upload = uploadXhr.upload;
          if (upload) {
            upload.addEventListener('progress', options.progress, false);
          }
          return uploadXhr;
        }
      }
      $.ajax(ajaxOptions);
    });
  }
});
```