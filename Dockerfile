FROM node:boron

# Create ygnode directory
RUN mkdir /ygnode
WORKDIR /ygnode

# Install app dependencies
COPY . /ygnode
RUN npm install -g forever && npm install

EXPOSE 8081
CMD  forever /ygnode/src/server.js
