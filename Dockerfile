FROM arm32v7/node:10.15.3-stretch

EXPOSE 55000

RUN apt-get update && apt-get install -y locales && rm -rf /var/lib/apt/lists/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

ENV LANG en_US.utf8 

WORKDIR /app

COPY package.json package-lock*.json ./

#RUN npm install --no-bin-links node-pre-gyp node-gyp -g
#RUN npm clean cache --force

RUN npm install  


COPY . .

CMD ["node", "server"]

