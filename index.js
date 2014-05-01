var dockerode = require('dockerode');
var fs = require('fs');
var http = require('http');
var url = require('url');

var config_data = fs.readFileSync(getUserHome() + '/.dockercfg', 'utf8');

var auth_config = new Buffer(JSON.stringify({
  username: process.env.DOCKER_USERNAME,
  password: process.env.DOCKER_PASSWORD,
  email: process.env.DOCKER_EMAIL,
  serveraddress: 'https://index.docker.io/v1/'
})).toString('base64');

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var config_file = new Buffer(config_data).toString('base64');

fs.exists('/var/run/docker.sock', function (exists) {

  var docker;

  if (exists) {
    docker = new dockerode({socketPath: '/var/run/docker.sock'});
  } else {
    if (process.env.DOCKER_HOST) {
      var parsed_url = url.parse(process.env.DOCKER_HOST);
      var docker_hostname = parsed_url.hostname;
      var docker_port = parsed_url.port;
      docker = new dockerode({host: 'http://' + docker_hostname, port: docker_port});
    } else {
      console.error('Docker not found');
      process.exit(-1);
    }
  }

  var server = http.createServer(function (req, res) {

    if (process.env.AUTH_TOKEN) {
      if (!req.headers['Authorization']) {
        res.statusCode = 401;
        return res.end();
      }
      if (req.headers['Authorization'] !== 'Bearer ' + process.env.AUTH_TOKEN) {
        res.statusCode = 401;
        return res.end();
      }
    }
    if (req.headers['content-type'] !== 'application/x-compressed') {
      res.statusCode = 403;
      return res.end();
    }

    var parsed_url = url.parse('http://' + req.url);
    var image_repo = parsed_url.pathname.slice(1);
    docker.buildImage(req, config_file, {
      t: image_repo
    }, function (err, build_stream) {
      if (err) {
        res.writeHead(500, 'Docker build error', {
          'Content-Type': 'application/json'
        });
        res.write(JSON.stringify(err));
        return res.end();
      }
      build_stream.on('data', function (data) {
        // print some progress?
      });
      build_stream.on('end', function () {
        // get the image id from a build
        var built_image = docker.getImage(image_repo);
        built_image.push({ }, function (err, push_stream) {
          if (err) {
            res.writeHead(500, 'Docker push error', {
              'Content-Type': 'application/json'
            });
            res.write(JSON.stringify(err));
            return res.end();
          }
          push_stream.on('data', function (data) {
            // print some progress?
          });
          push_stream.on('end', function () {
            res.writeHead(201, {
              'Content-Type': 'application/json'
            });
            res.write(JSON.stringify({
              message: image_repo + ' published successfully'
            }));
            res.end();
          });
        }, auth_config);
      });
    });
  });

  server.listen(8080);

});
