FROM node

WORKDIR /airbusProxy

COPY . .

EXPOSE 8100

CMD ["node" , "index"]
