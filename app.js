var http = require('http');

var server = http.createServer(function (req, res) {
  res.end("AJ Ostrow's Blog");
});

server.listen(process.env.PORT || 3000);