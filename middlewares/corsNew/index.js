'use strict';

/**
 * Module dependencies
 */
const cors = require('@koa/cors');

//CUSTOM CODE: I passed in both the frontend url and the backend url as the origins
const defaults = {
  origin: [process.env.FRONTEND_URL, process.env.URL],
  maxAge: 31536000,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  keepHeadersOnError: false,
};

module.exports = strapi => {
  return {
    /**
     * Initialize the hook
     */
    initialize() {
      const {
        origin,
        expose,
        maxAge,
        credentials,
        methods,
        headers,
        keepHeadersOnError,
      } = Object.assign({}, defaults, strapi.config.get('middleware.settings.cors'));

      strapi.app.use(
        cors({
          origin: async function(ctx) {
            let originList;

            if (typeof origin === 'function') {
              originList = await origin(ctx);
            } else {
              originList = origin;
            }

            const whitelist = Array.isArray(originList) ? originList : originList.split(/\s*,\s*/);

            console.log("white list: ", whitelist);

            const requestOrigin = ctx.accept.headers.origin;
            console.log("request origin: ", requestOrigin);
            if (whitelist.includes('*')) {
              return '*';
            }

            if (!whitelist.includes(requestOrigin)) {
              return ctx.throw(`${requestOrigin} is not a valid origin`);
            }

            return requestOrigin;
          },
          exposeHeaders: expose,
          maxAge,
          credentials,
          allowMethods: methods,
          allowHeaders: headers,
          keepHeadersOnError,
        })
      );
    },
  };
};
