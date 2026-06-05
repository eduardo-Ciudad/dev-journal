FROM node:22.17.0

WORKDIR /app-node

COPY package*.json ./

RUN npm install

COPY . .

ENTRYPOINT ["npm", "start"]