[Pusher](http://pusher.com/) is a glitzy websockets service for pushing messages from server to clients. I wondered how difficult it would be to copy their syntax. 

![Pusher Homepage](https://scontent-b-ord.xx.fbcdn.net/hphotos-frc3/1525423_10152184318627269_1207046623_n.jpg)

### The Clone

The server is a ruby rack application that must be run or mounted. It is accessed globally just like the real Pusher. 

```ruby
# config.ru

require 'faye'

class Pusher
  
  @server = Faye::RackAdapter.new(mount: '/faye', timeout: 25)
  
  def self.call(env)
    @server.call(env)
  end
  
  def self.trigger(channel, event, data = nil)
    @server.get_client.publish("/#{channel}", event: event, data: data)
  end
  
end
```

Assuming we're listening on 9292, the following code will get websockets working on the client. 

```javascript
var faye = new Faye.Client('http://localhost:9292/faye');
window.pusher = {
  subscribe: function(channel) {
    var handlers = {};
    faye.subscribe('/' + channel, function(message) {
      handlers[message.event](message.data);
    });
    function bind(evt, handler) { handlers[evt] = handler; }
    return { bind: bind };
  }
};
```

21 LOC. 

### Example Application

To cascade it with a sinatra app takes a few more lines of code, and serves as an example of a chat application.

```ruby
# config.ru

require 'sinatra'

get '/' do
  erb :index
end

post '/messages' do
  Pusher.trigger('messages', 'create', params[:messages])
  'message created'
end

run Rack::Cascade.new([ Pusher, Sinatra::Application ])
```

Client subscriptions work the same as well. 

```html
<!-- views/index.html.erb -->

<script src="http://localhost:9292/faye.js"></script>
<script>
  var channel = pusher.subscribe('messages');
  channel.bind('create', function(message) {
    console.log(message);
  });
</script>
```

### Trying It Out

Use the same syntax, and sub out Pusher for load-balanced redis-backed auto-scaling faye applications in production. 

To test it out locally, run the cascaded app specifying the production environment. The puma web server deals with sockets nicely, and is multi-threaded. 

```
$ gem install puma
$ puma config.ru -p 9292 -e production
```

Open http://localhost:9292 in a browser, and open the console. 

```
$ curl localhost:9292/messages -d "message=hello"
```

The message "hello" should appear in the console of the web browser. 
