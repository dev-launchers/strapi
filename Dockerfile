#syntax=docker/dockerfile:1.2
FROM strapi/base
WORKDIR /srv/app
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install
COPY . .
RUN --mount=type=secret,id=STRAPI_LICENSE export STRAPI_LICENSE=$(cat /run/secrets/STRAPI_LICENSE) && npm run build
CMD ["npm", "run", "start"]
