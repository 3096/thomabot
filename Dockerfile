# syntax=docker/dockerfile:1

FROM node:18-alpine
WORKDIR /app
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY src ./src
COPY data ./data
COPY .env .
RUN npm i
RUN npm i -g typescript
RUN tsc
CMD ["node", "--experimental-specifier-resolution=node", "-r", "source-map-support/register", "./out/index.js"]
