'use strict';

/**
 * Module dependencies
 */
const cors = require('@koa/cors');

const defaults = {
  origin: process.env.FRONTEND_URL,
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

            //const requestOrigin = ctx.accept.headers.origin;
            if (whitelist.includes('*')) {
              return '*';
            }
            //commented this out because it threw an error whenever we added the frontend_url as the origin
            /*
            if (!whitelist.includes(requestOrigin)) {
              return ctx.throw(`${requestOrigin} is A STUPID valid origin`);
            }*/
            //CUSTOM CODE: just return the front end url to be used as the orign
            return process.env.FRONTEND_URL;
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
