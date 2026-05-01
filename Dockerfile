FROM node:16.3.0-alpine
WORKDIR /myapp
COPY package*.json .
RUN "npm install"
COPY . .
ENTRYPOINT ["node", "index.js"]
