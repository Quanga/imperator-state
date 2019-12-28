FROM node:10.17-stretch AS build
RUN apt install git

WORKDIR /app

COPY package.json package-lock.json* ./

ENV PATH /app/node_modules/.bin$PATH

RUN npm install --production \
    && npm cache clean --force 


FROM node:10.17-alpine AS prod
WORKDIR /app
RUN apk add procps

COPY --from=build /app/node_modules node_modules
COPY . .

VOLUME /var/imperator/
EXPOSE 55000
EXPOSE 8000

CMD ["node", "server"]

