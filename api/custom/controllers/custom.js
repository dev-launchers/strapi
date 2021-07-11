'use strict';
module.exports = {
  async logout(ctx) {
    console.log('Successfully logged out');
    ctx.cookies.set('token', null);
    ctx.send({
      message: 'Successfully logged out',
    });
  },
};
