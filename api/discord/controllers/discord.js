'use strict';

const axios = require('axios');

module.exports = {
  async discordAuth(ctx){
    const { code } = ctx.query;
    if (!code) {
      return ctx.send({ message: 'There is not a code in the url' }, 500);
    }
    try {
      // post a request to get back the token type and an access token
      const discordData = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.REDIRECT_URL,
        scope: 'identify',
      };
      const oauthResult = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams(discordData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      // second request to get back the user discord information
      const userResult = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthResult.data.token_type} ${oauthResult.data.access_token}`,
        },
      });
      // update the discord information to the user
      const validatedBody = {
        discordId: userResult.data.id,
        discordUsername: userResult.data.username,
        discordAvatar: userResult.data.avatar,
        discordDiscriminator: userResult.data.discriminator,
      };
      const { id, username } = ctx.state.user;
      await strapi.query('user', 'users-permissions').update({ id: id}, validatedBody);
      if(!username){
        return ctx.redirect(`${process.env.FRONTEND_URL}/signup`);
      }
      return ctx.redirect(`${process.env.FRONTEND_URL}/user-profile`);
    } catch (error) {
      ctx.badRequest(error);
    }
  }
};
