Usage
#####

Run as a typical docker container

    docker run -d -p 8080 --name build-server -e AUTH_TOKEN=my_secret -v /var/run/docker.sock:/docker.sock /jkingyens/build-server

Make this container accessible/visible to your local development machine. On your local machine install the build-client:

    npm install -g build-client

Now you can publish docker images from your local machine by executing `publish` from your local directory.

    publish

This will return the id of the newly published image.
