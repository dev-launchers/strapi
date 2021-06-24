'use strict';

const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  //this allows us fetch timeCapsule via user id
  async find(ctx) {
    const { id } = ctx.params;
    const params = {
      user: id,
      ...ctx.query
    }
    const entity = await strapi.services["time-capsule"].find(params)
    return sanitizeEntity(entity, { model: strapi.models["time-capsule"] });
  }

};
