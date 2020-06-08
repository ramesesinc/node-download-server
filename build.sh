docker rmi ramesesinc/node-download-server:0.0.2 -f

docker system prune -f

docker build -t ramesesinc/node-download-server:0.0.2 --rm .
