FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.docker .env

EXPOSE 3000

CMD ["npm", "start"]