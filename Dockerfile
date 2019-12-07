FROM node:10.17-stretch

WORKDIR /app

# RUN apk add --no-cache --virtual .builds-deps \
#     build-base \
# binutils-gold \
# g++ \
# gcc \
# gnupg \
# libgcc \
# linux-headers \
# make \
# python \
# udev \
# && apk add procps git\
# && npm install bcrypt --build-from-source \
# && apk del .builds-deps 

# RUN apk add procps git curl



COPY package.json package-lock.json* ./

ENV PATH /app/node_modules/.bin$PATH

RUN ls
# RUN apk --no-cache add --virtual .builds-deps build-base python \
#     && npm config set python /usr/bin/python \
#     && npm i -g npm \
#     && npm i node-pre-gyp -g \
#     && npm i node-gyp \
#     && npm install --only=prod \
#     && npm cache clean --force \
#     && npm rebuild bcrypt --build-from-source \
#     && apk del .builds-deps

RUN npm install --only=prod \
    && npm cache clean --force 


COPY . .


EXPOSE 55000
EXPOSE 8000

CMD ["node", "server"]

