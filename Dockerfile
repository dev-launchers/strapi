#syntax=docker/dockerfile:1.2
FROM strapi/base
WORKDIR /srv/app
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install
COPY . .
RUN --mount=type=secret,id=strapi_license npm run build
CMD ["npm", "run", "start"]
