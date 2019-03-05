FROM node

WORKDIR /airbusProxy

COPY . .
RUN npm install
EXPOSE 8100

CMD ["node" , "index"]
