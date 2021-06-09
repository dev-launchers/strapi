'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  //this allows us to get points via user id
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.profile.findOne({ user: id })
    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  //this allows us to update points via user id
  async update(ctx) {
    const { id } = ctx.params;

     let entity;
     if (ctx.is('multipart')) {
       const { data, files } = parseMultipartData(ctx);
       entity = await strapi.services.profile.update({ user: id }, data, {
         files,
       });
     } else {
       entity = await strapi.services.profile.update({ user: id }, ctx.request.body);
     }

     return sanitizeEntity(entity, { model: strapi.models.profile });
  }
};
