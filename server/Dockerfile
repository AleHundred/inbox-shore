FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN mkdir -p data

EXPOSE 3001

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]
