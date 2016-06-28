var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var path = require('path');

var express = require('express');
var app = express();

function DownloadRequest(http,options,userres) {

    var req = https.request(options,function(res){

        if(Math.floor(res.statusCode/100)==2) {

            if(res.headers.hasOwnProperty('accept-ranges'))
            console.log(res.headers,typeof res.headers,res.statusCode);

            userres.set(res.headers);

            if(res.headers['content-type']==='application/octet-stream')
            {
              if(path.extname(options.path)!='')
              userres.type(path.extname(options.path));

              else
              userres.type('application/octet-stream');
            }

            res.pipe(userres);
        }

        else if(Math.floor(res.statusCode/100)==3) {

              console.log('Calling DownloadRequest() with ',options);
              var URL = url.parse(res.headers.location);

              if(http==0) {

                  var options = {
                    hostname : URL.hostname,
                    path : URL.path,
                    port : 443,
                    method : 'GET'
                  };

              }

              else {

                  var options = {
                    hostname : URL.hostname,
                    path : URL.path,
                    port : 80,
                    method : 'GET'
                  };

              }

              DownloadRequest(http,options,userres);
        }

        else {
          console.log(res.headers,typeof res.headers,res.statusCode/100);
          userres.end();
        }
    });

    req.end();

}

app.set('port', (process.env.PORT || 5000));

app.get('/see', function(request, response) {

  if(!request.query.url)
  {
    response.end();
    return;
  }

  var URL = url.parse(request.query.url);

  if(URL.protocol)
  {
      var http = 1;

      if(URL.protocol=='https:') {

          var options = {
            hostname : URL.hostname,
            path : URL.path,
            port : 443,
            method : 'GET'
          };

          http = 0;

      }

      else {

          var options = {
            hostname : URL.hostname,
            path : URL.path,
            port : 80,
            method : 'GET'
          };

      }

      console.log('Calling DownloadRequest() with ',options);
      DownloadRequest(http,options,response);
  }

});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
