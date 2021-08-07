module.exports = {
  //...
  settings: {
    cors: {
      enabled: true,
      origin: [process.env.FRONTEND_URL, process.env.URL, 'http://localhost:3000'],
    },
    logger: {
      level: 'debug', // process.env.STRAPI_LOG_LEVEL,
      exposeInContext: true,
      // Allow requests log in dev env
      requests: true, // process.env.NODE_ENV == 'development'
    }
  },
};
