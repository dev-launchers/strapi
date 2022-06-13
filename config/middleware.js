const { isDevEnv } = require('../utils/isDevEnv');

// all Devlaunchers internal projects domains
const DevLaunchersSubdomains = [
  'https://idea.devlaunchers.com',
  'https://idea-staging.devlaunchers.com',
  'https://projects.devlaunchers.org',
  'https://projects-staging.devlaunchers.org',
  'https://dev-recruiters.vercel.app',
  'https://recruiting-staging.devlaunchers.org',
  'https://recruiting.devlaunchers.org'
];

module.exports = {
  //...
  settings: {
    cors: {
      // We don't need to have CORS enabled in Dev Environment
      enabled: !isDevEnv(),
      origin: [process.env.FRONTEND_URL, process.env.URL, 'http://localhost:3000', ...DevLaunchersSubdomains],
    },
    logger: {
      level: process.env.STRAPI_LOG_LEVEL,
      exposeInContext: true,
      // Allow requests log in dev env
      requests: process.env.NODE_ENV == 'development'
    }
  },
};
