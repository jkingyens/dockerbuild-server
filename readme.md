Usage
#####

Example systemd unit file:

    [Unit]
    Description=Docker Build

    [Service]
    ExecStartPre=/usr/bin/docker pull jkingyens/build-server
    ExecStart=/usr/bin/docker run -e AUTH_TOKEN=secretkey -v /home/core/.dockercfg:/.dockercfg -v /var/run/docker.sock:/run/docker.sock  -e DOCKER_USERNAME=username -e DOCKER_PASSWORD=password -e DOCKER_EMAIL=email --rm --name build --publish-all=true jkingyens/build-server
    ExecStop=/usr/bin/bash -c "/usr/bin/docker stop build"

Run this on your server and make it accessible to the outside world. Then on your development machine run:

    npm install -g dockerbuild

Add these enviroment variables to your local devleopment machine:

  * BUILD_HOST - host of build-server deployment
  * BUILD_PORT - port of build-server deployment
  * BUILD_AUTH - the secret key you set in the AUTH_TOKEN server-side environment variable (see above)

Now you can publish docker images from your local machine by executing `publish` from your source code directory.

    publish <username/repo>

This will tar+gzip your build context, taking into consideration your .gitignore file (so node_modules will not transmit, for instance). It will then run a docker build job on the remote server, and push the resulting image to the public docker index, tagging it as username/repo.
