var express = require('express');
var path = require('path');
var httpProxy = require('http-proxy');
// var os = require("os");

var proxy = httpProxy.createProxyServer();
var app = express();
// var hostName = os.hostname();

var isProduction = process.env.NODE_ENV === 'production';
var port = isProduction ? process.env.PORT : 3000;
var publicPath = path.resolve(__dirname, 'public');

// var backend = 'http://' + hostName + ':8080';
// var frontend = 'http://' + hostName + ':8001';
var backend = 'http://localhost:8080';
var frontend = 'http://localhost:8001';

app.use(express.static(publicPath));

// We only want to run the workflow when not in production
if (!isProduction) {

  // We require the bundler inside the if block because
  // it is only needed in a development environment. Later
  // you will see why this is a good idea
  var bundle = require('./server/bundle.js');
  bundle();

  // Any requests to localhost:3000/sigf_global/build is proxied
  // to webpack-dev-server
  app.all('/appointment_book/build/*', function (req, res) {
    proxy.web(req, res, {
      target: frontend
    });
  });

  app.all('/appointment_book/api/*', function (req, res) {
    proxy.web(req, res, {
      target: frontend
    });
  });

} else {
  app.all('appointment_book/api/*', function (req, res) {
    // Rewrite path
    var url = req.url;
    url     = url.slice(15);
    req.url = url;

    proxy.web(req, res, {
      target: backend
    });
  });
}

// It is important to catch any errors from the proxy or the
// server will crash. An example of this is connecting to the
// server when webpack is bundling
proxy.on('error', function(e) {
  console.log('Could not connect to proxy, please try again...');
});

app.listen(port, function () {
  console.log('Server running on port ' + port);
});