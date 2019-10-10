FROM arm32v7/node:10.16.3-stretch

EXPOSE 55000

WORKDIR /app

COPY package.json package-lock*.json ./

ENV NODE_ENV=test

#RUN npm install --no-bin-links node-pre-gyp node-gyp -g
#RUN npm clean cache --force

RUN npm install  

COPY . .

CMD ["node", "server"]

