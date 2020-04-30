FROM node:10-alpine

# create workdir
WORKDIR /apps/server

# install dependencies
COPY . .

RUN npm install

# if building for production
# RUN npm ci --only=production

CMD ["node", "server.js"]
