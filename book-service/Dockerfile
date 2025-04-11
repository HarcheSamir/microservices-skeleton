FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY .env.docker .env

RUN npx prisma generate

EXPOSE 3002

CMD ["npm", "start"]