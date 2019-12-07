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

RUN npm install --only=prod \
    && npm cache clean --force 

COPY . .
VOLUME /var/imperator/

EXPOSE 55000
EXPOSE 8000

CMD ["node", "server"]

