var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var path = require('path');
var map = require('through2-map');
var express = require('express');

var app = express();

function DownloadRequest(http,options,userres) {

    var hostname = options.hostname;
    var client = null;

    if(http==0)
    client = https;

    else
    client = http;

    var req = client.request(options,function(res) {

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

            if((res.headers['content-type'].indexOf('text/html'))!=-1 || (res.headers['content-type'].indexOf('text/javascript'))!=-1)
            {
                console.log('HTML doc !!');

                  res.pipe(map({wantStrings: true}, function (str) {

                          function change(link) {
                              return `"https://pirata.herokuapp.com/see?url=${link.slice(2,link.length-1)}"`;
                          }

                          return str.replace(/"http:\/\/[^"]*"/g,change);

                  }))
                  .pipe(map({wantStrings: true}, function (str) {

                          function change(link) {
                              return `"https://pirata.herokuapp.com/see?url=${link.slice(1,link.length-1)}"`;
                          }

                          return str.replace(/="https:\/\/[^"]*"/g,change);

                  }))
                  .pipe(map({wantStrings: true}, function (str) {

                          function change(link) {
                              console.log("\nLINK : " + link);
                              return `"https://pirata.herokuapp.com/see?url=https://${hostname}${link.slice(1,link.length-1)}"`;
                          }

                          return str.replace(/"\/[^\/"]*"/g,change);

                  }))
                  .pipe(map({wantStrings: true}, function (str) {

                          function change(link) {
                              return `"https://pirata.herokuapp.com/see?url=https://${link.slice(3,link.length-1)}"`;
                          }

                          return str.replace(/"\/\/[^"]*"/g,change);

                  })).pipe(userres);
            }

            else
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
    response.end('Go home, kid.');
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

  else {
    response.end('Go home, kid.');
  }

});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
