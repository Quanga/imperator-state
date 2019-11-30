FROM node:10.17-alpine

RUN apk add --no-cache --virtual builds-deps build-base make gcc g++ python git \
    && apk add procps
#RUN npm config set python /usr/bin/python


WORKDIR /app
COPY package.json .
RUN npm install --only=prod
COPY . .
RUN apk del builds-deps  

ENV NODE_ENV test
EXPOSE 55000
EXPOSE 8000
CMD ["node", "server"]

