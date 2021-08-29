'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  async findByUserId(ctx) {
    try {
      const { id } = ctx.params;
      const params = {
        author: id,
        ...ctx.query
      };
      const entity = await strapi.services['idea-card'].find(params);
      return sanitizeEntity(entity, { model: strapi.models['idea-card'] });
    } catch(err) {
      console.error(err);
      ctx.badRequest(err);
    }
  }
};
