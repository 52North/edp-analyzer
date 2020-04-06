FROM node:alpine

ENV NODE_ENV production
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app

COPY package.json package-lock.json /app/

RUN set -ex \
    && apk add --no-cache --virtual .gyp python make g++ \
    && npm install \
    && apk del .gyp

COPY ./ /app/

USER node

CMD [ "node", "--experimental-modules", "/app/index.mjs" ]