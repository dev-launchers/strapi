'use strict';

const { isDevEnv } = require('../../../utils/isDevEnv');

module.exports = {
  async logout(ctx) {
    console.log('Successfully logged out');
    if (isDevEnv()) {
      ctx.cookies.set('token', null, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 14, // 14 Day Age,
        domain: 'localhost'
      });
    } else {
      ctx.cookies.set('token', null, {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 14, // 14 Day Age,
        domain: 'devlaunchers.com'
      });
    }

    ctx.send({
      message: 'Successfully logged out',
    });
  },
};
