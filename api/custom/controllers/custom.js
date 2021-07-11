'use strict';
module.exports = {
  async logout(ctx) {
    console.log('Successfully logged out');
    const token = ctx.cookies.get("token");
    if(!token) {
      console.log('TOKEN IS NULL: ', token);
    } else {
      console.log('TOKEN IN LOGOUT CONTROLLER: ', token);
    }

    ctx.cookies.set('token', null);
    ctx.send({
      message: 'Successfully logged out',
    });
  },
};
