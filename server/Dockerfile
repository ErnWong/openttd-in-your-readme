FROM node:14

COPY . /home/node
WORKDIR /home/node

RUN ["yarn", "install"]
RUN ["npm", "run", "build"]

EXPOSE 3000/tcp

CMD ["node", "./dist/index.js"]
