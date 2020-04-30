docker container stop node-download-server

docker container rm node-download-server

docker run -it -d \
    --name node-download-server \
    -p 8000:8000 \
    ramesesinc/node-download-server \
    node server.js
